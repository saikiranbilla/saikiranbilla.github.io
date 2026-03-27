/**
 * Portfolio project visuals: hero parallax, bento mini canvases, scroll reveal, cursor glow.
 */
(function () {
    var rafIds = [];
    var ioBento = null;

    function prefersReduced() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function clearLoops() {
        rafIds.forEach(function (id) {
            cancelAnimationFrame(id);
        });
        rafIds = [];
        if (ioBento) {
            ioBento.disconnect();
            ioBento = null;
        }
    }

    function setupHeroParallax() {
        if (prefersReduced()) return;
        var wrap = document.querySelector('.project-card__figure--parallax');
        var img = wrap && wrap.querySelector('img');
        if (!wrap || !img) return;

        wrap.addEventListener(
            'mousemove',
            function (e) {
                var r = wrap.getBoundingClientRect();
                var mx = (e.clientX - r.left - r.width / 2) * 0.02;
                var my = (e.clientY - r.top - r.height / 2) * 0.02;
                img.style.transform =
                    'translate(' + (-mx).toFixed(2) + 'px,' + (-my).toFixed(2) + 'px)';
            },
            { passive: true }
        );
        wrap.addEventListener(
            'mouseleave',
            function () {
                img.style.transform = '';
                img.style.transition = 'transform 0.5s ease';
            },
            { passive: true }
        );
        wrap.addEventListener(
            'mouseenter',
            function () {
                img.style.transition = 'transform 0.08s ease';
            },
            { passive: true }
        );
    }

    function resizeCanvas(canvas) {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var rect = canvas.getBoundingClientRect();
        var w = Math.max(2, Math.floor(rect.width * dpr));
        var h = Math.max(2, Math.floor(rect.height * dpr));
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
        return { ctx: canvas.getContext('2d'), w: w, h: h, dpr: dpr, cssW: rect.width, cssH: rect.height };
    }

    function loopAura(canvas, getSpeed) {
        var t = 0;
        function frame() {
            var sp = getSpeed();
            t += 0.022 * sp;
            var o = resizeCanvas(canvas);
            var ctx = o.ctx;
            var w = o.w;
            var h = o.h;
            ctx.clearRect(0, 0, w, h);
            var mid = h * 0.5;
            var colors = ['rgba(201,169,110,0.85)', 'rgba(138,155,176,0.75)', 'rgba(232,201,138,0.7)'];
            var i;
            for (i = 0; i < 3; i++) {
                ctx.beginPath();
                var x;
                for (x = 0; x <= w; x += 3) {
                    var nx = x / o.dpr;
                    var y =
                        mid +
                        Math.sin(nx * 0.045 + t * (0.9 + i * 0.15) + i * 1.7) * (22 - i * 5) * o.dpr;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = colors[i];
                ctx.lineWidth = 1.4 * o.dpr;
                ctx.stroke();
            }
            rafIds.push(requestAnimationFrame(frame));
        }
        rafIds.push(requestAnimationFrame(frame));
    }

    function loopClai(canvas, getSpeed) {
        var t = 0;
        var n = 6;
        function frame() {
            var sp = getSpeed();
            t += 0.008 * sp;
            var o = resizeCanvas(canvas);
            var ctx = o.ctx;
            var w = o.w;
            var h = o.h;
            ctx.clearRect(0, 0, w, h);
            var cx = w * 0.5;
            var cy = h * 0.52;
            var R = Math.min(w, h) * 0.28;
            var pts = [];
            var k;
            for (k = 0; k < n; k++) {
                var ang = (k / n) * Math.PI * 2 + t * 0.4;
                var wob = Math.sin(t * 0.7 + k) * 0.12;
                pts.push({
                    x: cx + Math.cos(ang + wob) * R,
                    y: cy + Math.sin(ang + wob) * R,
                });
            }
            ctx.strokeStyle = 'rgba(138,155,176,0.35)';
            ctx.lineWidth = 1 * o.dpr;
            var a;
            var b;
            for (a = 0; a < n; a++) {
                for (b = a + 1; b < n; b++) {
                    if ((a + b) % 2 === 0) continue;
                    ctx.beginPath();
                    ctx.moveTo(pts[a].x, pts[a].y);
                    ctx.lineTo(pts[b].x, pts[b].y);
                    ctx.stroke();
                }
            }
            ctx.fillStyle = 'rgba(201,169,110,0.75)';
            for (k = 0; k < n; k++) {
                ctx.beginPath();
                ctx.arc(pts[k].x, pts[k].y, 3.2 * o.dpr, 0, Math.PI * 2);
                ctx.fill();
            }
            rafIds.push(requestAnimationFrame(frame));
        }
        rafIds.push(requestAnimationFrame(frame));
    }

    function loopCompass(canvas, getSpeed) {
        var t = 0;
        function frame() {
            var sp = getSpeed();
            t += 0.012 * sp;
            var o = resizeCanvas(canvas);
            var ctx = o.ctx;
            var w = o.w;
            var h = o.h;
            ctx.clearRect(0, 0, w, h);
            var cx = w * 0.5;
            var cy = h * 0.5;
            var r = Math.min(w, h) * 0.36;
            ctx.strokeStyle = 'rgba(138,155,176,0.2)';
            ctx.lineWidth = 1 * o.dpr;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(201,169,110,0.55)';
            ctx.lineWidth = 1.2 * o.dpr;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(t) * r, cy + Math.sin(t) * r);
            ctx.stroke();
            rafIds.push(requestAnimationFrame(frame));
        }
        rafIds.push(requestAnimationFrame(frame));
    }

    function loopAbstract(canvas, getSpeed) {
        var t = 0;
        function frame() {
            var sp = getSpeed();
            t += 0.006 * sp;
            var o = resizeCanvas(canvas);
            var ctx = o.ctx;
            var w = o.w;
            var h = o.h;
            ctx.clearRect(0, 0, w, h);
            var i;
            for (i = 0; i < 5; i++) {
                ctx.strokeStyle = 'rgba(201,169,110,' + (0.15 + i * 0.06) + ')';
                ctx.lineWidth = 1 * o.dpr;
                ctx.strokeRect(
                    w * 0.15 + i * 12 * o.dpr + Math.sin(t + i) * 6 * o.dpr,
                    h * 0.25 + i * 10 * o.dpr,
                    w * 0.55 - i * 20 * o.dpr,
                    h * 0.35
                );
            }
            rafIds.push(requestAnimationFrame(frame));
        }
        rafIds.push(requestAnimationFrame(frame));
    }

    function setupQuillAnim(pre) {
        var code = pre.querySelector('code');
        if (!code) return;
        var card = pre.closest('.project-card--bento');
        var speedMul = 1;
        if (card) {
            card.addEventListener(
                'mouseenter',
                function () {
                    speedMul = 1.65;
                },
                { passive: true }
            );
            card.addEventListener(
                'mouseleave',
                function () {
                    speedMul = 1;
                },
                { passive: true }
            );
        }
        var bad = 'SELECT * FROM orders WEHRE region = "MW"';
        var good =
            'SELECT o.*, c.name FROM orders o JOIN customers c ON o.cid = c.id WHERE o.region = "MW";';
        var phase = 'typeBad';
        var i = 0;

        function wait(fn, ms) {
            setTimeout(fn, ms / speedMul);
        }

        function tick() {
            if (phase === 'typeBad') {
                i += 1;
                code.textContent = bad.slice(0, i);
                if (i >= bad.length) {
                    phase = 'pauseErr';
                    wait(tick, 750);
                    return;
                }
                wait(tick, 30);
            } else if (phase === 'pauseErr') {
                phase = 'deleteBad';
                tick();
            } else if (phase === 'deleteBad') {
                if (code.textContent.length <= 0) {
                    phase = 'typeGood';
                    i = 0;
                    wait(tick, 220);
                    return;
                }
                code.textContent = code.textContent.slice(0, -1);
                wait(tick, 11);
            } else if (phase === 'typeGood') {
                i += 1;
                code.textContent = good.slice(0, i);
                if (i >= good.length) {
                    phase = 'pauseDone';
                    wait(tick, 2400);
                    return;
                }
                wait(tick, 26);
            } else if (phase === 'pauseDone') {
                phase = 'typeBad';
                i = 0;
                wait(tick, 450);
            }
        }

        wait(tick, 500);
    }

    function bindMiniCanvas(card, kind) {
        var canvas = card.querySelector('.project-mini-canvas');
        if (!canvas || prefersReduced()) return;

        var getSpeed = function () {
            return card.matches(':hover') ? 1.55 : 1;
        };

        if (kind === 'aura') loopAura(canvas, getSpeed);
        else if (kind === 'clai') loopClai(canvas, getSpeed);
        else if (kind === 'compass') loopCompass(canvas, getSpeed);
        else loopAbstract(canvas, getSpeed);
    }

    function setupBentoGlow(card) {
        var glow = card.querySelector('.project-card__bento-glow');
        if (!glow) return;
        card.addEventListener(
            'mousemove',
            function (e) {
                var r = card.getBoundingClientRect();
                var x = ((e.clientX - r.left) / r.width) * 100;
                var y = ((e.clientY - r.top) / r.height) * 100;
                glow.style.setProperty('--gx', x + '%');
                glow.style.setProperty('--gy', y + '%');
            },
            { passive: true }
        );
    }

    function setupBentoReveal() {
        if (prefersReduced()) {
            document.querySelectorAll('.project-card--bento').forEach(function (el) {
                el.classList.add('is-visible');
            });
            return;
        }
        var cards = document.querySelectorAll('.projects__bento .project-card--bento');
        cards.forEach(function (el, i) {
            el.style.setProperty('--bento-reveal-delay', i * 100 + 'ms');
        });
        ioBento = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (en) {
                    if (en.isIntersecting) {
                        en.target.classList.add('is-visible');
                        ioBento.unobserve(en.target);
                    }
                });
            },
            { threshold: 0.08, rootMargin: '0px 0px -8% 0px' }
        );
        cards.forEach(function (c) {
            ioBento.observe(c);
        });
    }

    function initMiniVisuals() {
        document.querySelectorAll('.project-card--bento[data-mini-visual]').forEach(function (card) {
            var kind = card.getAttribute('data-mini-visual') || 'abstract';
            setupBentoGlow(card);
            if (kind === 'quill') {
                var pre = card.querySelector('.project-mini-quill');
                if (pre) setupQuillAnim(pre);
            } else {
                bindMiniCanvas(card, kind);
            }
        });
    }

    window.initPortfolioProjectEffects = function () {
        clearLoops();
        setupHeroParallax();
        initMiniVisuals();
        setupBentoReveal();
    };
})();
