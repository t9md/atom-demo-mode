# demo-mode

- Show keystroke and command on hover indicator.
- Intended to be used for atom package author to create explanatory GIF animation.
- Initially created for [vim-mode-plus](https://atom.io/packages/vim-mode-plus) and extracted to make this generally available.

![demo-mode](https://raw.githubusercontent.com/t9md/t9md/d582c61e8a6a743683ef2f8e5034e413394e5292/img/atom-demo-mode.gif)

# Development State

alpha

# Commands

- `demo-mode:toggle`: Start or stop, auto-hide based on `autoHideTimeout` setting.
- `demo-mode:toggle-without-auto-hide` Start or stop, no auto-hide. So need to `demo-mode:clear` or stop by `toggle`.
- `demo-mode:stop-or-start-auto-hide`: Prevent auto-hidden temporarily or re-start auto-hide, useful when you need manual control for auto-hide.
- `demo-mode:clear`: Clear currently displayed keystrokes, you don't need this in most case.
- `demo-mode:move-hover-up`: Move hover, position is remembered until deactivate package.
- `demo-mode:move-hover-down`: Move hover, position is remembered until deactivate package.
- `demo-mode:move-hover-left`: Move hover, position is remembered until deactivate package.
- `demo-mode:move-hover-right`: Move hover, position is remembered until deactivate package.

# Keymap

No keymap by default.
Find it by yourself.

### Mine

```coffeescript
'atom-text-editor.vim-mode-plus.normal-mode':
  # I enable this while actively use demo-mode.[ start by `,`, prevent-auto-hide by `;`]
  # ',': 'demo-mode:toggle'

  'space d': 'demo-mode:toggle'

'atom-workspace.demo-mode-active atom-text-editor:not([mini])':
  'up': 'demo-mode:move-hover-up'
  'down': 'demo-mode:move-hover-down'
  'left': 'demo-mode:move-hover-left'
  'right': 'demo-mode:move-hover-right'

  # I enable this while actively use demo-mode.[ start by `,`, prevent-auto-hide by `;`]
  # ';': 'demo-mode:stop-or-start-auto-hide'
```

# Style customization example

```less
.demo-mode-container {
  min-width: 30em;
  font-family: "Ricty";
  .keystroke {
    font-size: 1.5em;
  }
}
```

# Service consumer example.

demo-mode currently provide, `onWillAddItem` service which package author can to add extra information.

See [vim-mode-plus](https://github.com/t9md/atom-vim-mode-plus/) project for practical use-case.
