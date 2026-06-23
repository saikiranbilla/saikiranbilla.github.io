import './style.css'
import { render } from './app.js'
import { initPullString } from './pull-string.js'
import { initHoverImages } from './hover-img.js'

// Render the page from JS
render()

// Init interactive features
initPullString()
initHoverImages()

// Scroll-reveal for sections
function initScrollReveal() {
  const sections = document.querySelectorAll('[data-section]')
  if (!sections.length) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    sections.forEach(s => s.classList.add('visible'))
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  )

  sections.forEach(s => observer.observe(s))
}

initScrollReveal()
