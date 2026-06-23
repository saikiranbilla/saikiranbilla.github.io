import { getCurrentTheme, applyTheme, toggleTheme } from './theme.js'

export function initPullString() {
  const canvas = document.getElementById('pull-canvas')
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const html = document.documentElement
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const dpr = window.devicePixelRatio || 1

  // Hi-DPI canvas
  const W = 120, H = 300
  canvas.width = W * dpr
  canvas.height = H * dpr
  ctx.scale(dpr, dpr)

  // Anchor at top-center
  const ax = W / 2, ay = 0
  const restLen = 100
  const restX = ax, restY = ay + restLen

  // Knob state
  let kx = restX, ky = restY
  let vx = 0, vy = 0

  // Physics
  const maxStringLen = 170
  const stiffness = 0.16
  const damping = 0.78

  // Interaction
  let dragging = false
  let totalMoved = 0
  const knobRadius = 6
  const hitRadius = 22

  function canvasXY(e) {
    const rect = canvas.getBoundingClientRect()
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    return { x: cx * (W / rect.width), y: cy * (H / rect.height) }
  }

  function dist(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1
    return Math.sqrt(dx * dx + dy * dy)
  }

  function clampKnobToString() {
    ky = Math.max(ay + 20, ky)
    const d = dist(ax, ay, kx, ky) || 1
    if (d > maxStringLen) {
      kx = ax + ((kx - ax) / d) * maxStringLen
      ky = ay + ((ky - ay) / d) * maxStringLen
    }
  }

  function getColor(varName) {
    return getComputedStyle(html).getPropertyValue(varName).trim()
  }

  function draw() {
    ctx.clearRect(0, 0, W, H)

    const cordColor = getColor('--text-muted') || 'rgba(236,227,214,0.34)'
    const knobColor = getColor('--accent') || '#C8956C'

    const cpx = ax + (kx - ax) * 0.35
    const cpy = ay + (ky - ay) * 0.45

    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.quadraticCurveTo(cpx, cpy, kx, ky)
    ctx.strokeStyle = cordColor
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(kx, ky, knobRadius, 0, Math.PI * 2)
    ctx.fillStyle = knobColor
    ctx.fill()
  }

  function tick() {
    if (!dragging) {
      vx += (restX - kx) * stiffness
      vy += (restY - ky) * stiffness
      vx *= damping
      vy *= damping
      kx += vx
      ky += vy
      clampKnobToString()

      if (Math.abs(kx - restX) < 0.1 && Math.abs(ky - restY) < 0.1 &&
          Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) {
        kx = restX
        ky = restY
        vx = 0
        vy = 0
      }
    }

    draw()
    requestAnimationFrame(tick)
  }

  // Init
  applyTheme(getCurrentTheme(), false)
  draw()
  if (!reduced) {
    requestAnimationFrame(tick)
  }

  // Drag handlers
  function down(e) {
    const p = canvasXY(e)
    if (dist(p.x, p.y, kx, ky) > hitRadius + 10) return
    dragging = true
    totalMoved = 0
    vx = 0
    vy = 0
    e.preventDefault()
  }

  function move(e) {
    if (!dragging) return
    e.preventDefault()
    const p = canvasXY(e)
    const dx = p.x - kx
    const dy = p.y - ky
    vx = dx * 0.6
    vy = dy * 0.6
    kx = p.x
    ky = p.y
    clampKnobToString()
    totalMoved += Math.abs(dx) + Math.abs(dy)
    if (reduced) draw()
  }

  function up() {
    if (!dragging) return
    dragging = false

    const pulledDown = (ky - restY) > 40
    const isClick = totalMoved < 4

    if (pulledDown || isClick) {
      toggleTheme()
      draw()
    }

    if (reduced) {
      kx = restX
      ky = restY
      vx = 0
      vy = 0
      draw()
      return
    }

    if (pulledDown) {
      vy = Math.min(vy, -7)
    }
  }

  canvas.addEventListener('mousedown', down)
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
  canvas.addEventListener('touchstart', down, { passive: false })
  window.addEventListener('touchmove', move, { passive: false })
  window.addEventListener('touchend', up)

  canvas.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleTheme()
      draw()
      if (!reduced) {
        ky += 50
        vy = -7
      }
    }
  })
}
