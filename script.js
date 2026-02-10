document.addEventListener('DOMContentLoaded', function () {

    // --- Initialize Lucide icons ---
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // --- Scroll-triggered reveal animations ---
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.reveal').forEach(function (el) {
        // Stagger siblings within the same parent
        var siblings = el.parentElement.querySelectorAll('.reveal');
        var siblingIndex = Array.prototype.indexOf.call(siblings, el);
        el.style.transitionDelay = (siblingIndex * 0.1) + 's';

        observer.observe(el);
    });

    // --- Highlights Modal ---
    var highlightData = {
        leadership: {
            title: 'Leadership',
            items: [
                'AI Strategy Consultant @ BIG.',
                'Led 5-person team architecting multi-agent systems.',
                'Authored AI governance frameworks.'
            ]
        },
        impact: {
            title: 'Impact',
            items: [
                'Optimization: Slashed SQL latency by 40%.',
                'Scale: Orchestrated 8 autonomous agents.',
                'Safety: 99% moderation accuracy.'
            ]
        },
        certs: {
            title: 'Certs',
            items: [
                'Oracle Cloud GenAI Professional (2024).',
                'AWS Cloud Practitioner.',
                'Focus: RAG & LLM Fine-Tuning.'
            ]
        }
    };

    var highlightOverlay = document.getElementById('highlightOverlay');
    var highlightTitle = document.getElementById('highlightTitle');
    var highlightList = document.getElementById('highlightList');
    var highlightCloseBtn = document.getElementById('highlightClose');

    document.querySelectorAll('.highlight-item').forEach(function (item) {
        item.addEventListener('click', function () {
            var key = this.getAttribute('data-highlight');
            var data = highlightData[key];
            if (!data) return;
            highlightTitle.textContent = data.title;
            highlightList.innerHTML = data.items.map(function (t) {
                return '<li>' + t + '</li>';
            }).join('');
            highlightOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    function closeHighlight() {
        highlightOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    highlightCloseBtn.addEventListener('click', closeHighlight);
    highlightOverlay.addEventListener('click', function (e) {
        if (e.target === highlightOverlay) closeHighlight();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && highlightOverlay.classList.contains('active')) {
            closeHighlight();
        }
    });

    // --- Story Viewer ---
    var storyOverlay = document.getElementById('storyOverlay');
    var profilePic = document.getElementById('profilePic');

    if (profilePic && storyOverlay) {
        var storyCloseBtn = document.getElementById('storyClose');
        var storyPrev = document.getElementById('storyPrev');
        var storyNext = document.getElementById('storyNext');
        var slides = storyOverlay.querySelectorAll('.story-slide');
        var fills = storyOverlay.querySelectorAll('.progress-fill');
        var total = slides.length;
        var current = 0;
        var timer = null;
        var raf = null;
        var DURATION = 5000;
        var t0 = 0;

        function openStory() {
            storyOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            goTo(0);
        }

        function closeStory() {
            storyOverlay.classList.remove('active');
            document.body.style.overflow = '';
            stop();
            fills.forEach(function (f) { f.style.width = '0%'; });
        }

        function goTo(n) {
            if (n >= total) { closeStory(); return; }
            if (n < 0) n = 0;
            current = n;
            slides.forEach(function (s) { s.classList.remove('active'); });
            slides[n].classList.add('active');
            fills.forEach(function (f, i) {
                f.style.transition = 'none';
                f.style.width = i < n ? '100%' : '0%';
            });
            stop();
            t0 = Date.now();
            tick();
            timer = setTimeout(function () { goTo(current + 1); }, DURATION);
        }

        function tick() {
            var pct = Math.min(((Date.now() - t0) / DURATION) * 100, 100);
            fills[current].style.width = pct + '%';
            if (pct < 100) raf = requestAnimationFrame(tick);
        }

        function stop() {
            clearTimeout(timer);
            cancelAnimationFrame(raf);
        }

        profilePic.addEventListener('click', openStory);
        storyCloseBtn.addEventListener('click', closeStory);
        storyPrev.addEventListener('click', function () { goTo(current - 1); });
        storyNext.addEventListener('click', function () { goTo(current + 1); });

        document.addEventListener('keydown', function (e) {
            if (!storyOverlay.classList.contains('active')) return;
            if (e.key === 'Escape') closeStory();
            if (e.key === 'ArrowLeft') goTo(current - 1);
            if (e.key === 'ArrowRight') goTo(current + 1);
        });

        storyOverlay.addEventListener('click', function (e) {
            if (e.target === storyOverlay) closeStory();
        });
    }

    // --- Smooth scroll for anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;

            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

});
