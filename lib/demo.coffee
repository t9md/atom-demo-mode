{CompositeDisposable, Disposable} = require 'atom'
_ = require 'underscore-plus'
globalState = require './global-state'
settings = require './settings'

DemoModeCommands = [
  'demo-mode:toggle'
  'demo-mode:toggle-without-auto-hide'
  'demo-mode:stop-or-start-auto-hide'
  'demo-mode:clear'
]

module.exports =
class Demo
  constructor: (@emitter, {@autoHide}) ->
    @workspaceElement = atom.views.getView(atom.workspace)
    @disposables = new CompositeDisposable
    @containerMounted = false

    globalState.marginTopInEm ?= settings.get('initialMarginTopInEm')
    globalState.marginLeftInEm ?= settings.get('initialMarginLeftInEm')

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
      margin-top: #{globalState.marginTopInEm}em;
      margin-left: #{globalState.marginLeftInEm}em;
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
    @emitter.emit('on-will-add-item', event)

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
      @unmountContainer()

    @autoHideTimeoutID = setTimeout(hideCallback, timeout)

  mountContainer: ->
    @applyMargin()
    @workspaceElement.appendChild(@getContainer())
    @containerMounted = true

  unmountContainer: ->
    @container?.remove()
    @container = null
    @containerMounted = false

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
    @unmountContainer()

  destroy: ->
    @disposables.dispose()
    @styleElement?.remove()
    @container?.remove()

  moveHover: (direction) ->
    switch direction
      when 'up' then globalState.marginTopInEm -= 1
      when 'down' then globalState.marginTopInEm += 1
      when 'left' then globalState.marginLeftInEm -= 1
      when 'right' then globalState.marginLeftInEm += 1
    @applyMargin()
