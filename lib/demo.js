const {CompositeDisposable, Disposable} = require("atom")
const _ = require("underscore-plus")
const settings = require("./settings")

const DemoModeCommands = [
  "demo-mode:toggle",
  "demo-mode:toggle-without-auto-hide",
  "demo-mode:stop-or-start-auto-hide",
  "demo-mode:clear",
]

module.exports = class Demo {
  constructor(state) {
    this.state = state
    this.workspaceElement = atom.views.getView(atom.workspace)

    if (state.marginTopInEm == null) state.marginTopInEm = settings.get("initialMarginTopInEm")
    if (state.marginLeftInEm == null) state.marginLeftInEm = settings.get("initialMarginLeftInEm")

    this.workspaceElement.classList.add("demo-mode-active")

    this.disposables = new CompositeDisposable(
      new Disposable(() => this.workspaceElement.classList.remove("demo-mode-active")),
      atom.keymaps.onDidMatchBinding(event => {
        if (!DemoModeCommands.includes(event.binding.command)) this.add(event)
      })
    )
  }

  applyMargin() {
    if (this.state.styleElement != null) {
      this.state.styleElement.remove()
    }
    this.state.styleElement = document.createElement("style")
    document.head.appendChild(this.state.styleElement)
    const rules = `margin-top: ${this.state.marginTopInEm}em;\nmargin-left: ${this.state.marginLeftInEm}em;`
    this.state.styleElement.sheet.addRule(".demo-mode-container", rules)
  }

  elementForKeystroke({command, keystrokes}) {
    const element = document.createElement("div")
    keystrokes = keystrokes
      .split(" ")
      .map(keystroke => keystroke.replace(/^shift-/, ""))
      .join(" ")

    element.className = "binding"
    element.innerHTML = `<span class='keystroke'>${keystrokes}</span><span class='command'>${command}</span>`
    return element
  }

  getContainer() {
    if (!this.container) {
      this.container = document.createElement("div")
      this.container.tabIndex = -1
      this.container.className = "demo-mode-container"
    }
    return this.container
  }

  emitOnWillAddItem(event) {
    this.state.emitter.emit("will-add-item", event)
  }

  add(event) {
    this.cancelFadeoutHover()
    this.mountContainerIfNecessary()

    const container = this.getContainer()
    const item = this.elementForKeystroke(event.binding)
    this.emitOnWillAddItem({item, event})
    container.appendChild(item)

    if (container.childElementCount > settings.get("maxKeystrokeToShow")) {
      container.firstElementChild.remove()
    }

    if (this.state.autoHide) {
      this.hideAfter(settings.get("autoHideTimeout"))
    }
  }

  hideAfter(timeout) {
    this.clearAutoHideTimeout()
    this.autoHideTimeoutID = setTimeout(() => this.fadeoutHover(), timeout)
  }

  mountContainerIfNecessary() {
    if (!this.container) {
      this.applyMargin()
      this.workspaceElement.appendChild(this.getContainer())
    }
  }

  unmountContainer() {
    if (this.container) {
      this.container.remove()
      this.container = null
      this.state.emitter.emit("did-remove-hover")
    }
  }

  fadeoutHover() {
    if (this.container) {
      this.container.classList.add("fadeout")
      this.fadeoutHoverTimeoutID = setTimeout(() => this.unmountContainer(), 1000)
    }
  }

  stopOrStartAutoHide() {
    if (this.state.autoHide) {
      // Stop scheduled auto hide task to keep it display.
      this.clearAutoHideTimeout()
      this.state.autoHide = false
    } else {
      this.fadeoutHover()
      this.state.autoHide = true
    }
  }

  clearAutoHideTimeout() {
    if (this.autoHideTimeoutID != null) {
      clearTimeout(this.autoHideTimeoutID)
      this.autoHideTimeoutID = null
    }
  }

  cancelFadeoutHover() {
    if (this.container) this.container.classList.remove("fadeout")

    if (this.fadeoutHoverTimeoutID != null) {
      clearTimeout(this.fadeoutHoverTimeoutID)
      this.fadeoutHoverTimeoutID = null
    }
  }

  clear() {
    this.clearAutoHideTimeout()
    this.unmountContainer()
  }

  destroy() {
    this.disposables.dispose()
    this.clear()
  }

  moveHover(direction) {
    if (direction === "up") this.state.marginTopInEm -= 1
    else if (direction === "down") this.state.marginTopInEm += 1
    else if (direction === "left") this.state.marginLeftInEm -= 1
    else if (direction === "right") this.state.marginLeftInEm += 1
    this.applyMargin()
  }
}
