const html = document.documentElement
const themeColors = { dark: '#0E0B0A', light: '#F4F0EB' }

export function getCurrentTheme() {
  return html.dataset.theme === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme, shouldPersist) {
  const next = theme === 'light' ? 'light' : 'dark'
  html.dataset.theme = next

  const meta = document.getElementById('theme-color')
  if (meta) {
    meta.setAttribute('content', themeColors[next])
  }

  const canvas = document.getElementById('pull-canvas')
  if (canvas) {
    canvas.setAttribute('aria-pressed', next === 'light' ? 'true' : 'false')
    canvas.setAttribute(
      'aria-label',
      next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    )
  }

  if (shouldPersist) {
    try { localStorage.setItem('theme', next) } catch (e) { }
  }
}

export function toggleTheme() {
  const next = getCurrentTheme() === 'dark' ? 'light' : 'dark'
  applyTheme(next, true)
}
