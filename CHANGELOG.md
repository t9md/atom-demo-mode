# 0.4.1:
- Fix: Fix incorrect `shift-` modifier removal.

# 0.4.0:
- New: added following command
  - `demo-mode:toggle-auto-hide`
  - `demo-mode:clear`
- New: double-clicking hover invoke `demo-mode:toggle-auto-hide`.
  - Also hover border-color indicate auto-hide state by adding `auto-hide` css class.
- Breaking: remove following commands to simplify usage
  - `demo-mode:toggle-without-auto-hide`
  - `demo-mode:stop-or-start-auto-hide`:

# 0.3.0:
- New: Now hover indicator is movable by mousedrag.
- Maintenance: Convert CoffeeScript to JavaScript.
- Breaking: Configuration parameter removed and addd.
  - Added: `initialTopInPixel`(default `50`), `initialLeftInPixel`(default `50`)
  - Removed: `initialMarginTopInEm`, `initialMarginLeftInEm`

# 0.2.1:
- UX: Fadeout animation when hover indicator disappear.

# 0.2.0:
- Improve: Add `activationCommands` in `package.json`, now `demo-mode:toggle`, `demo-mode:toggle-without-auto-hide` trigger package activation.
- New: `onDidRemoveHover` service to do action on hover removal timing.
- Internal: Code cleanup

# 0.1.0:
- Initial version.
