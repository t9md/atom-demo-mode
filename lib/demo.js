const {CompositeDisposable, Disposable} = require("atom")
const _ = require("underscore-plus")
const settings = require("./settings")

const DemoModeCommands = ["demo-mode:toggle", "demo-mode:toggle-auto-hide", "demo-mode:clear"]

module.exports = class Demo {
  constructor(emitter, state) {
    this.emitter = emitter
    this.state = state

    this.workspaceElement = atom.views.getView(atom.workspace)

    this.handleMouseDown = this.handleMouseDown.bind(this)

    this.workspaceElement.classList.add("demo-mode-active")

    this.disposables = new CompositeDisposable(
      new Disposable(() => this.workspaceElement.classList.remove("demo-mode-active")),
      atom.keymaps.onDidMatchBinding(event => {
        if (!DemoModeCommands.includes(event.binding.command)) this.add(event)
      })
    )
    this.emitter.emit("did-start")
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
      this.keystrokeContainer = document.createElement("div")
      this.container.addEventListener("mousedown", this.handleMouseDown)
    }
    return this.container
  }

  handleMouseDown(event) {
    if (event.detail === 2) {
      this.toggleAutoHide()
      return
    }
    if (this.container) this.container.classList.remove("fadeout")
    this.cancelFadeoutHoverTimeout()
    this.clearAutoHideTimeout()

    if (this.mouseObservers) {
      this.mouseObservers.dispose()
      this.mouseObservers = null
    }

    const dragOrigin = {
      left: event.clientX - this.state.left,
      top: event.clientY - this.state.top,
    }

    const handleMouseMove = event => {
      this.state.left = event.clientX - dragOrigin.left
      this.state.top = event.clientY - dragOrigin.top
      this.render()
    }

    const handleMouseUp = () => this.mouseObservers.dispose()

    window.addEventListener("mousemove", handleMouseMove)
    this.container.addEventListener("mouseup", handleMouseUp)
    this.mouseObservers = new Disposable(() => {
      window.removeEventListener("mousemove", handleMouseMove)
      this.container.removeEventListener("mouseup", handleMouseUp)
    })
  }

  render() {
    if (this.container) {
      const editor = atom.workspace.getActiveTextEditor()
      this.container.style.top = this.state.top + "px"
      this.container.style.left = this.state.left + "px"
    }
  }

  add(event) {
    if (this.container && this.container.classList.contains("fadeout")) {
      this.unmountContainer()
      this.cancelFadeoutHoverTimeout()
    }
    this.mountContainerIfNecessary()

    const item = this.elementForKeystroke(event.binding)
    this.emitter.emit("will-add-item", {item, event, container: this.container})
    const {keystrokeContainer} = this
    keystrokeContainer.appendChild(item)

    if (keystrokeContainer.childElementCount > settings.get("maxKeystrokeToShow")) {
      keystrokeContainer.firstElementChild.remove()
    }

    if (settings.get("autoHide")) {
      this.hideAfter(settings.get("autoHideTimeout"))
    }
  }

  hideAfter(timeout) {
    this.clearAutoHideTimeout()
    this.autoHideTimeoutID = setTimeout(() => this.fadeoutHover(), timeout)
  }

  mountContainerIfNecessary() {
    if (!this.container) {
      this.container = document.createElement("div")
      this.container.tabIndex = -1
      this.container.className = "demo-mode-container"
      this.updateAutoHideClass()
      this.keystrokeContainer = document.createElement("div")
      this.keystrokeContainer.className = "keystroke-container"

      this.container.appendChild(this.keystrokeContainer)
      this.container.addEventListener("mousedown", this.handleMouseDown)

      this.workspaceElement.appendChild(this.container)
      this.render()
      this.emitter.emit("did-add-hover", this.container)
    }
  }

  unmountContainer() {
    if (this.container) {
      this.container.remove()
      this.container = null
      this.emitter.emit("did-remove-hover")
    }
  }

  fadeoutHover() {
    this.cancelFadeoutHoverTimeout()

    if (this.container) {
      this.emitter.emit("will-fadeout-hover")
      this.container.classList.add("fadeout")
      this.fadeoutHoverTimeoutID = setTimeout(() => this.unmountContainer(), 1000)
    }
  }

  updateAutoHideClass() {
    if (this.container) this.container.classList.toggle("auto-hide", settings.get("autoHide"))
  }

  toggleAutoHide() {
    settings.toggle("autoHide")
    this.clearAutoHideTimeout()
    this.updateAutoHideClass()
    if (settings.get("autoHide")) {
      this.fadeoutHover()
    }
  }

  clearAutoHideTimeout() {
    if (this.autoHideTimeoutID != null) {
      clearTimeout(this.autoHideTimeoutID)
      this.autoHideTimeoutID = null
    }
  }

  cancelFadeoutHoverTimeout() {
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
    this.clearAutoHideTimeout()
    this.unmountContainer()
    this.emitter.emit("did-stop")
  }

  moveHover(direction) {
    if (direction === "up") this.state.top -= 10
    else if (direction === "down") this.state.top += 10
    else if (direction === "left") this.state.left -= 10
    else if (direction === "right") this.state.left += 10
    this.render()
  }
}
