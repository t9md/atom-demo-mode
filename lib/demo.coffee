{CompositeDisposable, Disposable} = require 'atom'
_ = require 'underscore-plus'
settings = require './settings'

DemoModeCommands = [
  'demo-mode:toggle'
  'demo-mode:toggle-without-auto-hide'
  'demo-mode:stop-or-start-auto-hide'
  'demo-mode:clear'
]

module.exports =
class Demo
  constructor: (@state, {@autoHide}) ->
    @workspaceElement = atom.views.getView(atom.workspace)
    @disposables = new CompositeDisposable
    @containerMounted = false

    @state.marginTopInEm ?= settings.get('initialMarginTopInEm')
    @state.marginLeftInEm ?= settings.get('initialMarginLeftInEm')

    @workspaceElement.classList.add('demo-mode-active')
    @disposables.add new Disposable =>
      @workspaceElement.classList.remove('demo-mode-active')

    @disposables.add atom.keymaps.onDidMatchBinding (event) =>
      return if event.binding.command in DemoModeCommands
      @add(event)

  applyMargin: ->
    @styleElement?.remove()
    @styleElement = document.createElement 'style'
    document.head.appendChild(@styleElement)
    @styleElement.sheet.addRule '.demo-mode-container', """
      margin-top: #{@state.marginTopInEm}em;
      margin-left: #{@state.marginLeftInEm}em;
      """

  elementForKeystroke: ({command, keystrokes}) ->
    element = document.createElement('div')
    keystrokes = keystrokes.split(' ')
      .map (keystroke) -> keystroke.replace(/^shift-/, '')
      .join(' ')
    element.className = 'binding'
    element.innerHTML = """
      <span class='keystroke'>#{keystrokes}</span>
      <span class='command'>#{command}</span>
      """
    element

  getContainer: ->
    if @container?
      @container
    else
      @container = document.createElement('div')
      @container.tabIndex = -1
      @container.className = 'demo-mode-container'
      @container

  emitOnWillAddItem: (event) ->
    @state.emitter.emit('will-add-item', event)

  add: (event) ->
    container = @getContainer()

    item = @elementForKeystroke(event.binding)
    @emitOnWillAddItem({item, event})
    container.appendChild(item)

    if container.childElementCount > settings.get('maxKeystrokeToShow')
      container.firstElementChild.remove()
    @mountContainer() unless @containerMounted

    if @autoHide
      @hideAfter(settings.get('autoHideTimeout'))

  hideAfter: (timeout) ->
    clearTimeout(@autoHideTimeoutID) if @autoHideTimeoutID?
    hideCallback = =>
      @autoHideTimeoutID = null
      @removeHover()

    @autoHideTimeoutID = setTimeout(hideCallback, timeout)

  mountContainer: ->
    @applyMargin()
    @workspaceElement.appendChild(@getContainer())
    @containerMounted = true

  removeHover: ->
    @container?.remove()
    @container = null
    @containerMounted = false
    @state.emitter.emit('did-remove-hover')

  stopOrStartAutoHide: ->
    if @autoHide
      # Stop scheduled auto hide task to keep it display.
      clearTimeout(@autoHideTimeoutID) if @autoHideTimeoutID?
      @autoHide = false
    else
      @clear()
      @autoHide = true

  clear: ->
    clearTimeout(@autoHideTimeoutID) if @autoHideTimeoutID?
    @removeHover()

  destroy: ->
    @disposables.dispose()
    @styleElement?.remove()
    @removeHover()
    @containerMounted = null

  moveHover: (direction) ->
    switch direction
      when 'up' then @state.marginTopInEm -= 1
      when 'down' then @state.marginTopInEm += 1
      when 'left' then @state.marginLeftInEm -= 1
      when 'right' then @state.marginLeftInEm += 1
    @applyMargin()
