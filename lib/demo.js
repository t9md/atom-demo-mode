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

    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)

    if (state.left == null) state.left = settings.get("initialLeftInPixel")
    if (state.top == null) state.top = settings.get("initialTopInPixel")

    this.workspaceElement.classList.add("demo-mode-active")

    this.disposables = new CompositeDisposable(
      new Disposable(() => this.workspaceElement.classList.remove("demo-mode-active")),
      atom.keymaps.onDidMatchBinding(event => {
        if (!DemoModeCommands.includes(event.binding.command)) this.add(event)
      })
    )
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
      this.container.addEventListener("mousedown", this.handleMouseDown)
    }
    return this.container
  }

  handleMouseDown(event) {
    this.dragOrigin = {
      top: event.clientY - this.state.top,
      left: event.clientX - this.state.left,
    }

    if (this.mouseObservers) {
      this.mouseObservers.dispose()
      this.mouseObservers = null
    }

    const handleMouseMove = this.handleMouseMove
    const handleMouseUp = () => this.mouseObservers.dispose()
    const handleMouseLeave = () => this.mouseObservers.dispose()

    this.container.addEventListener("mousemove", handleMouseMove)
    this.container.addEventListener("mouseup", handleMouseUp)
    this.container.addEventListener("mouseleave", handleMouseLeave)

    this.mouseObservers = new Disposable(() => {
      this.container.removeEventListener("mousemove", handleMouseMove)
      this.container.removeEventListener("mouseup", handleMouseUp)
      this.container.removeEventListener("mouseleave", handleMouseLeave)
    })
  }

  handleMouseMove(event) {
    this.clearAutoHideTimeout()
    this.state.left = event.clientX - this.dragOrigin.left
    this.state.top = event.clientY - this.dragOrigin.top
    this.render()
  }

  render() {
    if (this.container) {
      const editor = atom.workspace.getActiveTextEditor()
      this.container.style.top = this.state.top + "px"
      this.container.style.left = this.state.left + "px"
    }
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
      this.workspaceElement.appendChild(this.getContainer())
      this.render()
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
    if (direction === "up") this.state.top -= 10
    else if (direction === "down") this.state.top += 10
    else if (direction === "left") this.state.left -= 10
    else if (direction === "right") this.state.left += 10
    this.render()
  }
}
