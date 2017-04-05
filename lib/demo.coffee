{CompositeDisposable, Disposable, Emitter} = require 'atom'
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
  constructor: ({@autoHide}) ->
    @workspaceElement = atom.views.getView(atom.workspace)
    @emitter = new Emitter
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
    commandShort = command.replace(/^vim-mode-plus:/, '')
    element = document.createElement('div')
    keystrokes = keystrokes.split(' ')
      .map (keystroke) -> keystroke.replace(/^shift-/, '')
      .join(' ')
    element.className = 'binding'
    # kind = @getKindForCommand(command)
    element.innerHTML = """
      <span class='keystroke'>#{keystrokes}</span>
      <span class='commmaand'>#{commandShort}</span>
      """
      # <span class='kind pull-right'>#{kind}</span>
    element

  # getKindForCommand: (command) ->
  #   if command.startsWith('vim-mode-plus')
  #     command = command.replace(/^vim-mode-plus:/, '')
  #     if command.startsWith('operator-modifier')
  #       kind = 'op-modifier'
  #     else
  #       Base.getKindForCommandName(command) ? 'vmp-other'
  #   else
  #     'non-vmp'

  getContainer: ->
    if @container?
      @container
    else
      @container = document.createElement('div')
      @container.tabIndex = -1
      @container.className = 'demo-mode-container'
      @container

  add: (event) ->
    if @autoHide
      @hideAfter(settings.get('autoHideTimeout'))

    container = @getContainer()
    container.appendChild(@elementForKeystroke(event.binding))
    if container.childElementCount > settings.get('maxKeystrokeToShow')
      container.firstElementChild.remove()
    @mountContainer() unless @containerMounted

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
    console.log 'destroyed!'
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
