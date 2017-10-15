const {CompositeDisposable, Emitter} = require("atom")
const settings = require("./settings")
const Demo = require("./demo")

module.exports = {
  config: settings.config,

  activate() {
    this.demo = null
    this.emitter = new Emitter()
    this.state = {left: settings.get("initialLeftInPixel"), top: settings.get("initialTopInPixel")}

    this.disposables = new CompositeDisposable(
      atom.commands.add("atom-workspace", {
        "demo-mode:toggle": () => this.toggle(),
        "demo-mode:toggle-auto-hide": () => this.demo && this.demo.toggleAutoHide(),
        "demo-mode:clear": () => this.demo && this.demo.fadeoutHover(),
        "demo-mode:move-hover-up": () => this.demo && this.demo.moveHover("up"),
        "demo-mode:move-hover-down": () => this.demo && this.demo.moveHover("down"),
        "demo-mode:move-hover-left": () => this.demo && this.demo.moveHover("left"),
        "demo-mode:move-hover-right": () => this.demo && this.demo.moveHover("right"),
      })
    )
  },

  deactivate() {
    if (this.demo) this.demo.destroy()
    this.disposables.dispose()
  },

  toggle() {
    if (this.demo) {
      this.demo.destroy()
      this.demo = null
    } else {
      this.demo = new Demo(this.emitter, this.state)
    }
  },

  provideDemoMode() {
    return {
      onWillAddItem: this.onWillAddItem.bind(this),
      onDidStart: this.onDidStart.bind(this),
      onDidStop: this.onDidStop.bind(this),
      onWillFadeoutHover: this.onWillFadeoutHover.bind(this),
      onDidRemoveHover: this.onDidRemoveHover.bind(this),
    }
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
  onWillFadeoutHover(fn) {
    return this.emitter.on("will-fadeout-hover", fn)
  },
  onDidRemoveHover(fn) {
    return this.emitter.on("did-remove-hover", fn)
  },
}
