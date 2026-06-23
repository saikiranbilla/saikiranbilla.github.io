export function initHoverImages() {
  const popover = document.getElementById('hover-img')
  const img = document.getElementById('hover-img-el')
  if (!popover || !img) return

  // Preload images
  const triggers = document.querySelectorAll('.hover-trigger')
  triggers.forEach(t => {
    const src = t.dataset.hoverImg
    if (src) new Image().src = src
  })

  let active = false

  function show(src, x, y) {
    img.src = src
    active = true
    popover.classList.add('visible')
    position(x, y)
  }

  function hide() {
    active = false
    popover.classList.remove('visible')
  }

  function position(x, y) {
    if (!active) return

    const pad = 16
    const w = popover.offsetWidth || 280
    const h = popover.offsetHeight || 200
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Position to the right and slightly above cursor
    let left = x + 20
    let top = y - h / 2

    // Clamp to viewport
    if (left + w + pad > vw) left = x - w - 20
    if (top < pad) top = pad
    if (top + h + pad > vh) top = vh - h - pad

    popover.style.left = left + 'px'
    popover.style.top = top + 'px'
  }

  document.addEventListener('mousemove', (e) => {
    const trigger = e.target.closest('.hover-trigger')

    if (trigger) {
      const src = trigger.dataset.hoverImg
      if (!active || img.src !== new URL(src, location.href).href) {
        show(src, e.clientX, e.clientY)
      } else {
        position(e.clientX, e.clientY)
      }
    } else if (active) {
      hide()
    }
  })

  document.addEventListener('mouseleave', hide)
}
