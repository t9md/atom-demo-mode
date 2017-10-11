function inferType(value) {
  if (Number.isInteger(value)) return "integer"
  if (Array.isArray(value)) return "array"
  if (typeof value === "boolean") return "boolean"
  if (typeof value === "string") return "string"
}

class Settings {
  constructor(scope, config) {
    // complement `type` field by inferring it from default value.
    // Also translate direct `boolean` value to {default: `boolean`} object
    this.scope = scope
    this.config = config

    const configNames = Object.keys(this.config)
    for (let i = 0; i < configNames.length; i++) {
      const name = configNames[i]
      let value = this.config[name]

      // Translate direct value to { default: value } form.
      if (typeof value !== "object") {
        value = {default: value}
        this.config[name] = value
      }

      if (!value.type) value.type = inferType(value.default)
      // Inject order to appear at setting-view in ordered.
      value.order = i
    }
  }

  get(param) {
    return atom.config.get(`${this.scope}.${param}`)
  }

  set(param, value) {
    return atom.config.set(`${this.scope}.${param}`, value)
  }

  toggle(param) {
    return this.set(param, !this.get(param))
  }

  has(param) {
    return param in atom.config.get(this.scope)
  }

  delete(param) {
    return this.set(param, undefined)
  }

  observe(param, fn) {
    return atom.config.observe(`${this.scope}.${param}`, fn)
  }
}

module.exports = new Settings("demo-mode", {
  autoHideTimeout: {
    default: 1000,
    min: 0,
  },
  maxKeystrokeToShow: {
    default: 5,
    min: 1,
  },
  initialTopInPixel: 50,
  initialLeftInPixel: 50,
})
