const {CompositeDisposable, Emitter} = require("atom")
const settings = require("./settings")
const Demo = require("./demo")

module.exports = {
  config: settings.config,

  activate() {
    this.demo = null
    this.emitter = new Emitter()
    this.state = {emitter: this.emitter}

    this.disposables = new CompositeDisposable(
      atom.commands.add("atom-workspace", {
        "demo-mode:toggle": () => this.toggle({autoHide: true}),
        "demo-mode:toggle-without-auto-hide": () => this.toggle({autoHide: false}),
        "demo-mode:stop-or-start-auto-hide": () => this.demo && this.demo.stopOrStartAutoHide(),
        "demo-mode:clear": () => this.clear(),
        "demo-mode:move-hover-up": () => this.demo && this.demo.moveHover("up"),
        "demo-mode:move-hover-down": () => this.demo && this.demo.moveHover("down"),
        "demo-mode:move-hover-left": () => this.demo && this.demo.moveHover("left"),
        "demo-mode:move-hover-right": () => this.demo && this.demo.moveHover("right"),
      })
    )
  },

  // Public: Invoke the given callback when before adding item to hover indicator.
  // * `callback` {Function} to be called.
  //   * `event` {Object} with the following keys:
  //     * `item` DOM element to be added, modify this as you like.
  //     * `event`: original event passed on `atom.keymap.onDidMatchBinding`.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onWillAddItem(fn) {
    return this.emitter.on("will-add-item", fn)
  },
  onDidStart(fn) {
    return this.emitter.on("did-start", fn)
  },
  onDidStop(fn) {
    return this.emitter.on("did-stop", fn)
  },
  onDidAddHover(fn) {
    return this.emitter.on("did-add-hover", fn)
  },
  onWillFadeoutHover(fn) {
    return this.emitter.on("will-fadeout-hover", fn)
  },
  onDidRemoveHover(fn) {
    return this.emitter.on("did-remove-hover", fn)
  },
  clear() {
    this.demo && this.demo.clear()
  },
  getContainer() {
    this.demo && this.demo.getContainer()
  },
  getDemo() {
    return this.demo
  },

  provideDemoMode() {
    return {
      getDemo: this.getDemo.bind(this),
      onWillAddItem: this.onWillAddItem.bind(this),
      onDidStart: this.onDidStart.bind(this),
      onDidStop: this.onDidStop.bind(this),
      onDidAddHover: this.onDidAddHover.bind(this),
      onWillFadeoutHover: this.onWillFadeoutHover.bind(this),
      onDidRemoveHover: this.onDidRemoveHover.bind(this),
      clear: this.clear.bind(this),
      getContainer: this.getContainer.bind(this),
    }
  },

  deactivate() {
    if (this.state.styleElement) this.state.styleElement.remove()
    if (this.demo) this.stop()
    this.disposables.dispose()
  },

  toggle(options) {
    if (this.demo) this.stop()
    else this.start(options)
  },

  start(options = {}) {
    this.state = Object.assign(this.state, options)
    this.demo = new Demo(this.state)
    this.emitter.emit("did-start")
  },

  stop() {
    this.demo.destroy()
    this.demo = null
    this.emitter.emit("did-stop")
  },
}
