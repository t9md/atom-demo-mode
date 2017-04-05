inferType = (value) ->
  switch
    when Number.isInteger(value) then 'integer'
    when typeof(value) is 'boolean' then 'boolean'
    when typeof(value) is 'string' then 'string'
    when Array.isArray(value) then 'array'

class Settings
  constructor: (@scope, @config) ->
    # Automatically infer and inject `type` of each config parameter.
    # skip if value which aleady have `type` field.
    # Also translate bare `boolean` value to {default: `boolean`} object
    for key in Object.keys(@config)
      if inferedType = inferType(@config[key])
        @config[key] = {default: @config[key]}
        @config[key].type = inferedType

      value = @config[key]
      value.type ?= inferType(value.default)

    # Inject order props to display orderd in setting-view
    for name, i in Object.keys(@config)
      @config[name].order = i

  get: (param) ->
    atom.config.get("#{@scope}.#{param}")

  set: (param, value) ->
    atom.config.set("#{@scope}.#{param}", value)

  toggle: (param) ->
    @set(param, not @get(param))

  has: (param) ->
    param of atom.config.get(@scope)

  delete: (param) ->
    @set(param, undefined)

  observe: (param, fn) ->
    atom.config.observe "#{@scope}.#{param}", fn

module.exports = new Settings 'demo-mode',
  autoHideTimeout:
    default: 1000
    min: 0
  maxKeystrokeToShow:
    default: 5
    min: 1
  initialMarginTopInEm: 5
  initialMarginLeftInEm: 2
