{CompositeDisposable, Emitter} = require 'atom'
settings = require './settings'
Demo = null

module.exports =
  config: settings.config

  activate: ->
    @demo = null
    @disposables = new CompositeDisposable
    @emitter = new Emitter
    @state = {@emitter}

    @disposables.add atom.commands.add 'atom-workspace',
      'demo-mode:toggle': => @toggle(autoHide: true)
      'demo-mode:toggle-without-auto-hide': => @toggle(autoHide: false)
      'demo-mode:stop-or-start-auto-hide': => @demo?.stopOrStartAutoHide()
      'demo-mode:clear': => @demo?.clear()
      'demo-mode:move-hover-up': => @demo?.moveHover('up')
      'demo-mode:move-hover-down': => @demo?.moveHover('down')
      'demo-mode:move-hover-left': => @demo?.moveHover('left')
      'demo-mode:move-hover-right': => @demo?.moveHover('right')

  # Public: Invoke the given callback when before adding item to hover indicator.
  # * `callback` {Function} to be called.
  #   * `event` {Object} with the following keys:
  #     * `item` DOM element to be added, modify this as you like.
  #     * `event`: original event passed on `atom.keymap.onDidMatchBinding`.
  #
  # Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onWillAddItem: (fn) -> @emitter.on('on-will-add-item', fn)
  onDidStart: (fn) -> @emitter.on('on-did-start', fn)
  onDidStop: (fn) -> @emitter.on('on-did-stop', fn)

  provideDemoMode: ->
    onWillAddItem: @onWillAddItem.bind(this)
    onDidStart: @onDidStart.bind(this)
    onDidStop: @onDidStop.bind(this)

  deactivate: ->
    @disposables.dispose()

  toggle: (options) ->
    Demo ?= require './demo'

    if @demo?
      @demo.destroy()
      @demo = null
      @emitter.emit('on-did-stop')
    else
      @demo = new Demo(@state, options)
      @emitter.emit('on-did-start')
