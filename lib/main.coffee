{CompositeDisposable} = require 'atom'
settings = require './settings'
Demo = null

module.exports =
  config: settings.config

  activate: ->
    @demo = null
    @disposables = new CompositeDisposable
    
    @disposables.add atom.commands.add 'atom-text-editor:not([mini])',
      'demo-mode:toggle-without-auto-hide': => @toggle(autoHide: false)
      'demo-mode:toggle': => @toggle(autoHide: true)
      'demo-mode:stop-or-start-auto-hide': => @demo?.stopOrStartAutoHide()
      'demo-mode:clear': => @demo?.clear()
      'demo-mode:move-hover-up': => @demo?.moveHover('up')
      'demo-mode:move-hover-down': => @demo?.moveHover('down')
      'demo-mode:move-hover-left': => @demo?.moveHover('left')
      'demo-mode:move-hover-right': => @demo?.moveHover('right')

  deactivate: ->
    @disposables.dispose()

  toggle: (options) ->
    Demo ?= require './demo'

    if @demo?
      @demo.destroy()
      @demo = null
    else
      @demo = new Demo(options)
