/**
 * Yantra full-viewport intro on each load (skipped only for prefers-reduced-motion or data-yantra-skip).
 * Dispatches 'yantra-complete' when the page shell should be fully shown.
 * Exposes window.onYantraIntroDone(cb) for hero sequence (sync if skipped).
 */
(function () {
    let finished = false;
    const waiters = [];

    function finish() {
        if (finished) return;
        finished = true;
        waiters.splice(0).forEach(function (fn) {
            try {
                fn();
            } catch (e) {
                console.error(e);
            }
        });
    }

    window.onYantraIntroDone = function (cb) {
        if (typeof cb !== 'function') return;
        if (finished) cb();
        else waiters.push(cb);
    };

    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function showPage() {
        const hero = document.querySelector('.site-hero');
        const header = document.querySelector('.site-header');
        [hero, header].forEach(function (el) {
            if (!el) return;
            el.style.transition = 'opacity 0.5s ease';
            el.style.opacity = '1';
        });
        document.body.classList.remove('yantra-playing');
        /* Defer so app.js DOMContentLoaded can register the listener first (defer script order). */
        queueMicrotask(function () {
            document.dispatchEvent(new Event('yantra-complete'));
        });
    }

    function hideIntroEl(intro) {
        intro.style.display = 'none';
        intro.setAttribute('aria-hidden', 'true');
        intro.classList.add('yantra-intro--done');
    }

    function skipIntro(intro) {
        hideIntroEl(intro);
        showPage();
        finish();
    }

    function playYantraIntro(intro, graphic) {
        document.body.classList.add('yantra-playing');
        intro.style.display = 'flex';
        intro.style.opacity = '1';
        intro.setAttribute('aria-hidden', 'false');

        const label = document.getElementById('yantra-intro-label');

        window.setTimeout(function () {
            if (label) label.classList.add('yantra-intro__label--visible');
        }, 1000);

        window.setTimeout(function () {
            intro.style.transition = 'opacity 0.6s ease';
            graphic.style.transition = 'opacity 0.6s ease';
            graphic.style.opacity = '0';
            intro.style.opacity = '0';
        }, 2800);

        window.setTimeout(function () {
            hideIntroEl(intro);
            graphic.style.opacity = '';
            graphic.style.transition = '';
            intro.style.opacity = '';
            intro.style.transition = '';
            showPage();
            finish();
        }, 3400);
    }

    document.addEventListener('DOMContentLoaded', function () {
        const intro = document.getElementById('yantra-intro');
        const graphic = document.getElementById('yantra-intro-graphic');
        if (!intro || !graphic) {
            showPage();
            finish();
            return;
        }

        if (document.documentElement.hasAttribute('data-yantra-skip')) {
            skipIntro(intro);
            return;
        }

        if (prefersReducedMotion()) {
            skipIntro(intro);
            return;
        }

        playYantraIntro(intro, graphic);
    });
})();
