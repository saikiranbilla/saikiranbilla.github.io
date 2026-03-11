function initCornerArc() {
  console.log('[yantra] init called, width:', window.innerWidth)
  if (window.innerWidth > 768) return
  console.log('[yantra] mobile confirmed, looking for sidebar...')
  const sidebar = document.querySelector('.sidebar')
  console.log('[yantra] sidebar found:', !!sidebar)
  if (!sidebar) return
  if (document.getElementById('corner-geo')) {
    console.log('[yantra] canvas already exists, skipping')
    return
  }

  document.addEventListener('resize', () => {
    const c = document.getElementById('corner-geo')
    if (c) c.style.display = window.innerWidth > 768 ? 'none' : 'block'
  })

  const SIZE = 160
  const canvas = document.createElement('canvas')
  canvas.id = 'corner-geo'
  canvas.width = SIZE * 2
  canvas.height = SIZE * 2
  canvas.style.cssText = `
    position: absolute;
    top: 0;
    right: 0;
    width: ${SIZE}px;
    height: ${SIZE}px;
    pointer-events: none;
    z-index: 0;
    opacity: 1;
  `

  sidebar.style.position = 'relative'
  sidebar.style.overflow = 'hidden'
  sidebar.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)

  // Origin pinned to top-right corner of canvas
  const ox = SIZE
  const oy = 0
  const COPPER = '#C8956C'
  let t = 0
  let running = true

  function glowRing(radius, alpha, lineWidth) {
    ctx.save()
    ctx.globalAlpha = alpha * 0.35
    ctx.shadowColor = COPPER
    ctx.shadowBlur = 10
    ctx.lineWidth = lineWidth * 2
    ctx.strokeStyle = COPPER
    ctx.beginPath()
    ctx.arc(ox, oy, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = COPPER
    ctx.beginPath()
    ctx.arc(ox, oy, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  function ticks(radius, count, tickLen, rot, alpha) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.lineWidth = 0.6
    ctx.strokeStyle = COPPER
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rot
      const len = i % 4 === 0 ? tickLen * 2 : tickLen
      ctx.beginPath()
      ctx.moveTo(ox + Math.cos(angle) * radius, oy + Math.sin(angle) * radius)
      ctx.lineTo(ox + Math.cos(angle) * (radius - len), oy + Math.sin(angle) * (radius - len))
      ctx.stroke()
    }
    ctx.restore()
  }

  function sweepDot(radius, angle, alpha) {
    const ex = ox + Math.cos(angle) * radius
    const ey = oy + Math.sin(angle) * radius
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = COPPER
    ctx.shadowColor = COPPER
    ctx.shadowBlur = 14
    ctx.beginPath()
    ctx.arc(ex, ey, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Trailing arc
    ctx.save()
    ctx.globalAlpha = alpha * 0.5
    ctx.strokeStyle = COPPER
    ctx.lineWidth = 1
    ctx.setLineDash([3, 4])
    ctx.beginPath()
    ctx.arc(ox, oy, radius, angle - 0.5, angle)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }

  function draw() {
    ctx.clearRect(0, 0, SIZE, SIZE)

    // Ambient corner glow
    const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, SIZE)
    glow.addColorStop(0, 'rgba(200,149,108,0.07)')
    glow.addColorStop(1, 'rgba(200,149,108,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, SIZE, SIZE)

    // 4 concentric rings rotating at different speeds
    glowRing(145, 0.3, 0.7)
    ticks(145, 36, 6, t, 0.28)

    glowRing(118, 0.22, 0.6)
    ticks(118, 24, 5, -t * 0.5, 0.2)

    glowRing(91, 0.18, 0.5)
    ticks(91, 16, 4, t * 0.8, 0.16)

    glowRing(64, 0.12, 0.4)

    // Two orbiting sweep dots
    sweepDot(132, Math.PI * 0.75 + t * 0.4, 0.85)
    sweepDot(105, Math.PI * 0.85 - t * 0.25, 0.6)
  }

  function animate(timestamp) {
    t += 0.0008
    draw()
    if (running) requestAnimationFrame(animate)
  }

  // Pause when tab not visible for performance
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden
    if (running) requestAnimationFrame(animate)
  })

  requestAnimationFrame(animate)
}

function tryInit() {
  if (window.innerWidth > 768) return
  if (document.getElementById('corner-geo')) return

  const sidebar = document.querySelector('.sidebar')
  if (!sidebar) return

  initCornerArc()
}

// Try every possible moment
document.addEventListener('DOMContentLoaded', tryInit)
window.addEventListener('load', tryInit)

// Retry with increasing delays as fallback
setTimeout(tryInit, 100)
setTimeout(tryInit, 300)
setTimeout(tryInit, 600)
setTimeout(tryInit, 1000)
setTimeout(tryInit, 2000)

// MutationObserver watches for sidebar being added
const obs = new MutationObserver(() => {
  if (document.querySelector('.sidebar') && !document.getElementById('corner-geo')) {
    tryInit()
  }
})
obs.observe(document.body, { childList: true, subtree: true })
