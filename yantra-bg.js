/**
 * Hero yantra accent: rotating rings in a contained canvas (not full viewport).
 */
(function () {
    var canvas = document.getElementById('yantra-bg');
    if (!canvas || !canvas.getContext) return;

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var ctx = canvas.getContext('2d', { alpha: true });
    var dpr = 1;
    var w = 0;
    var h = 0;
    var minDim = 1;
    var cx = 0;
    var cy = 0;

    var GOLD_A = 0.32;
    var SILVER_A = 0.22;
    var DOT_A = 0.55;
    var SPACER_A = 0.18;

    var LINE = 1;
    var PROXIMITY_PX_MAX = 300;
    var LERP = 0.04;
    var MAX_MULT = 2.5;
    var BREATHE_S = 5;
    var TWO_PI = Math.PI * 2;
    /** Whole-mandala rotation (rad/frame); very slow, calm drift */
    var GLOBAL_OMEGA = 0.00105;
    var globalRotation = 0;

    /** Radial light pulse (max 2 concurrent) */
    var PULSE_SPEED = 180;
    var PULSE_INTERVAL_MS = 4000;
    var PULSE_MAX = 2;
    var PULSE_HOLD_MS = 300;
    var PULSE_DECAY_MS = 420;
    var TRAIL_SAMPLE_MS = 42;
    var TRAIL_FADE_MS = 800;
    var RESIDUE_RGB = '201, 169, 110';
    var PULSE_EDGE_A = 0.6;
    var BOOST_ALPHA_HI = 0.7;
    var BRIGHT_RGB = { r: 232, g: 201, b: 138 };

    var pulses = [];
    var nextPulseSpawnAt = 0;
    var ringPulseState = [];

    function initRingPulseState() {
        ringPulseState = [];
        var i;
        for (i = 0; i < rings.length; i++) {
            ringPulseState.push({ holdEnd: 0, fadeEnd: 0 });
        }
    }

    var mouseX = 0;
    var mouseY = 0;
    var hasMouse = false;

    var ringCount = 7;
    var rings = [];

    function buildRings() {
        rings = [];
        var i;
        for (i = 0; i < ringCount; i++) {
            var t = ringCount > 1 ? i / (ringCount - 1) : 0;
            var rPct = 0.08 + t * (0.48 - 0.08);
            var nTris = Math.round(12 + (i * 12) / (ringCount - 1));
            nTris = Math.max(12, Math.min(24, nTris));
            var baseSpeed = (0.009 - t * (0.009 - 0.0022)) * 0.34;
            var dir = i % 2 === 0 ? 1 : -1;
            var useSilver = i % 2 === 1;
            var isOuterDiamond = i === ringCount - 1;
            rings.push({
                rPct: rPct,
                n: nTris,
                baseOmega: baseSpeed * dir,
                omega: baseSpeed * dir,
                useSilver: useSilver,
                isDiamond: isOuterDiamond,
                pointOut: i % 2 === 0,
            });
        }
    }

    buildRings();
    initRingPulseState();

    function onMove(e) {
        hasMouse = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
    }

    function onLeave() {
        hasMouse = false;
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    function onTouch(e) {
        if (e.touches && e.touches[0]) onMove(e.touches[0]);
    }
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    document.body.addEventListener('mouseleave', onLeave, { passive: true });

    /** Read laid-out size (client* is often 0 for %/aspect-ratio children before paint). */
    function readCanvasCssSize() {
        var rect = canvas.getBoundingClientRect();
        var cw = Math.round(rect.width) || canvas.clientWidth || canvas.offsetWidth || 0;
        var ch = Math.round(rect.height) || canvas.clientHeight || canvas.offsetHeight || 0;
        return { cw: cw, ch: ch };
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        var sz = readCanvasCssSize();
        var cw = sz.cw;
        var ch = sz.ch;
        if (cw < 2 || ch < 2) return false;
        w = cw;
        h = ch;
        minDim = Math.max(1, Math.min(w, h));
        cx = w * 0.5;
        cy = h * 0.5;
        canvas.width = Math.floor(cw * dpr);
        canvas.height = Math.floor(ch * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return true;
    }

    function proximityRadiusPx() {
        return Math.min(PROXIMITY_PX_MAX, minDim * 0.9);
    }

    /** Distance from pointer to canvas center in viewport pixels */
    function distMouseToCanvasCenter() {
        var rect = canvas.getBoundingClientRect();
        var mcx = rect.left + rect.width * 0.5;
        var mcy = rect.top + rect.height * 0.5;
        var dx = mouseX - mcx;
        var dy = mouseY - mcy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function ringProximityFactor(ringRpx) {
        if (!hasMouse) return 0;
        var rect = canvas.getBoundingClientRect();
        var mcx = rect.left + rect.width * 0.5;
        var mcy = rect.top + rect.height * 0.5;
        var dx = mouseX - mcx;
        var dy = mouseY - mcy;
        var mouseR = Math.sqrt(dx * dx + dy * dy);
        var delta = Math.abs(mouseR - ringRpx);
        var span = minDim * 0.11;
        var f = 1 - Math.min(1, delta / span);
        return f < 0 ? 0 : f;
    }

    function targetOmegaForRing(ring, ringRpx) {
        var base = ring.baseOmega;
        if (!hasMouse) return base;

        var proxR = proximityRadiusPx();
        var d = distMouseToCanvasCenter();
        if (d >= proxR) return base;

        var distFactor = 1 - d / proxR;
        var near = ringProximityFactor(ringRpx);
        var mult = 1 + distFactor * (0.55 + 0.45 * near) * (MAX_MULT - 1);
        if (mult > MAX_MULT) mult = MAX_MULT;
        var add = distFactor * 0.003 * (0.5 + 0.5 * near);
        return base * mult + Math.sign(base) * add;
    }

    function breatheScale(tSec) {
        var phase = (tSec % BREATHE_S) / BREATHE_S * TWO_PI;
        return 1 + 0.035 * Math.sin(phase);
    }

    function shimmer(tSec) {
        return 0.88 + 0.12 * (0.5 + 0.5 * Math.sin(tSec * 1.15));
    }

    function goldStroke(tSec) {
        var m = shimmer(tSec);
        return 'rgba(201, 169, 110,' + (GOLD_A * m) + ')';
    }

    function silverStroke(tSec) {
        var m = shimmer(tSec + 1.7);
        return 'rgba(138, 155, 176,' + (SILVER_A * m) + ')';
    }

    function dotFill(tSec) {
        var m = shimmer(tSec + 0.9);
        return 'rgba(201, 169, 110,' + (DOT_A * m) + ')';
    }

    function spacerStroke(tSec) {
        return 'rgba(138, 155, 176,' + (SPACER_A * shimmer(tSec + 0.4)) + ')';
    }

    function getRingBoostVisual(i, nowMs) {
        var s = ringPulseState[i];
        if (!s || nowMs >= s.fadeEnd) return 0;
        if (nowMs < s.holdEnd) return 1;
        return 1 - (nowMs - s.holdEnd) / (s.fadeEnd - s.holdEnd);
    }

    function triggerRingPulse(i, nowMs) {
        var s = ringPulseState[i];
        s.holdEnd = Math.max(s.holdEnd, nowMs + PULSE_HOLD_MS);
        s.fadeEnd = s.holdEnd + PULSE_DECAY_MS;
    }

    function strokeForRing(ring, tSec, ringIdx, nowMs) {
        var b = getRingBoostVisual(ringIdx, nowMs);
        if (b <= 0.001) {
            return ring.useSilver ? silverStroke(tSec) : goldStroke(tSec);
        }
        var baseA = ring.useSilver ? SILVER_A * shimmer(tSec + 1.7) : GOLD_A * shimmer(tSec);
        var aBlend = baseA * (1 - b) + BOOST_ALPHA_HI * b;
        var r = 201 + (BRIGHT_RGB.r - 201) * b;
        var g = 169 + (BRIGHT_RGB.g - 169) * b;
        var bl = 110 + (BRIGHT_RGB.b - 110) * b;
        return 'rgba(' + r + ',' + g + ',' + bl + ',' + aBlend + ')';
    }

    function dotFillForRing(tSec, ringIdx, nowMs) {
        var b = getRingBoostVisual(ringIdx, nowMs);
        if (b <= 0.001) return dotFill(tSec);
        var baseA = DOT_A * shimmer(tSec + 0.9);
        var aBlend = baseA * (1 - b) + BOOST_ALPHA_HI * b;
        var r = 201 + (BRIGHT_RGB.r - 201) * b;
        var g = 169 + (BRIGHT_RGB.g - 169) * b;
        var bl = 110 + (BRIGHT_RGB.b - 110) * b;
        return 'rgba(' + r + ',' + g + ',' + bl + ',' + aBlend + ')';
    }

    function spacerStrokeBoosted(tSec, spacerIdx, nowMs) {
        var b =
            Math.max(getRingBoostVisual(spacerIdx, nowMs), getRingBoostVisual(spacerIdx + 1, nowMs)) * 0.65;
        var base = spacerStroke(tSec);
        if (b <= 0.001) return base;
        var m = base.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i);
        if (!m) return base;
        var ba = parseFloat(m[4], 10);
        var aBlend = ba * (1 - b) + BOOST_ALPHA_HI * 0.45 * b;
        var r = parseInt(m[1], 10) + (BRIGHT_RGB.r - parseInt(m[1], 10)) * b;
        var g = parseInt(m[2], 10) + (BRIGHT_RGB.g - parseInt(m[2], 10)) * b;
        var bl = parseInt(m[3], 10) + (BRIGHT_RGB.b - parseInt(m[3], 10)) * b;
        return 'rgba(' + r + ',' + g + ',' + bl + ',' + aBlend + ')';
    }

    function drawSpacerCircle(radius, tSec, spacerIdx, nowMs) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, TWO_PI);
        ctx.strokeStyle = spacerStrokeBoosted(tSec, spacerIdx, nowMs);
        ctx.lineWidth = LINE * 0.88;
        ctx.stroke();
    }

    function drawTriangleAt(angle, r, wBase, hRad, pointOut) {
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        var tx = -sin;
        var ty = cos;
        var radial = pointOut ? 1 : -1;
        var bx = cx + r * cos;
        var by = cy + r * sin;
        var ax = cx + (r + hRad * radial) * cos;
        var ay = cy + (r + hRad * radial) * sin;
        var hW = wBase * 0.5;
        var x1 = bx + tx * hW;
        var y1 = by + ty * hW;
        var x2 = bx - tx * hW;
        var y2 = by - ty * hW;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.stroke();
    }

    function drawDot(px, py, tSec, ringIdx, nowMs) {
        ctx.beginPath();
        ctx.arc(px, py, 1.65, 0, TWO_PI);
        ctx.fillStyle = dotFillForRing(tSec, ringIdx, nowMs);
        ctx.fill();
    }

    function drawDiamondAt(angle, r, size) {
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        var px = cx + r * cos;
        var py = cy + r * sin;
        var hs = size * 0.5;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle + Math.PI * 0.25);
        ctx.beginPath();
        ctx.rect(-hs, -hs, size, size);
        ctx.stroke();
        ctx.restore();
    }

    function drawRing(ring, angleOffset, rPx, tSec, ringIdx, nowMs) {
        ctx.strokeStyle = strokeForRing(ring, tSec, ringIdx, nowMs);
        ctx.lineWidth = LINE;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (ring.isDiamond) {
            var n = ring.n;
            var k;
            var diamondSize = (TWO_PI * rPx) / n * 0.42;
            for (k = 0; k < n; k++) {
                var a = angleOffset + (k / n) * TWO_PI;
                drawDiamondAt(a, rPx, diamondSize);
            }
            for (k = 0; k < n; k++) {
                var a2 = angleOffset + (k / n) * TWO_PI;
                drawDot(cx + rPx * Math.cos(a2), cy + rPx * Math.sin(a2), tSec, ringIdx, nowMs);
            }
            return;
        }

        var n2 = ring.n;
        var arcPer = TWO_PI / n2;
        var wBase = 2 * rPx * Math.sin(arcPer * 0.36);
        var hRad = wBase * 1.8;
        var j;
        for (j = 0; j < n2; j++) {
            var ang = angleOffset + j * arcPer;
            drawTriangleAt(ang, rPx, wBase, hRad, ring.pointOut);
            var cos = Math.cos(ang);
            var sin = Math.sin(ang);
            drawDot(cx + rPx * cos, cy + rPx * sin, tSec, ringIdx, nowMs);
        }
    }

    function outerRingRadiusPx() {
        return rings[ringCount - 1].rPct * minDim;
    }

    function drawPulseWavefront(rw) {
        if (rw < 2) return;
        var inner = Math.max(0.5, rw - 2.5);
        var outer = rw + 40;
        var span = outer - inner;
        var peakT = (rw - inner) / span;
        var g = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
        g.addColorStop(0, 'rgba(201,169,110,0)');
        g.addColorStop(Math.max(0, peakT - 0.06), 'rgba(201,169,110,0.08)');
        g.addColorStop(Math.min(1, peakT + 0.02), 'rgba(201,169,110,' + PULSE_EDGE_A + ')');
        g.addColorStop(1, 'rgba(201,169,110,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, outer, 0, TWO_PI);
        ctx.arc(cx, cy, inner, 0, TWO_PI, true);
        ctx.fill('evenodd');
    }

    function drawPulseTrails(nowMs) {
        var p;
        var si;
        for (p = 0; p < pulses.length; p++) {
            var trail = pulses[p].trail;
            for (si = 0; si < trail.length; si++) {
                var s = trail[si];
                var age = nowMs - s.t;
                if (age < 0 || age >= TRAIL_FADE_MS) continue;
                var alpha = 0.03 * (1 - age / TRAIL_FADE_MS);
                if (alpha < 0.002) continue;
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = 'rgba(' + RESIDUE_RGB + ',1)';
                ctx.lineWidth = 1.75;
                ctx.beginPath();
                ctx.arc(cx, cy, Math.max(0.5, s.r), 0, TWO_PI);
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1;
    }

    function stepPulses(nowMs) {
        var dieR = outerRingRadiusPx() + 20;
        var i;
        var p;
        var ri;

        if (pulses.length < PULSE_MAX && nowMs >= nextPulseSpawnAt) {
            pulses.push({ start: nowMs, lastR: -0.001, trail: [], lastTrailSample: 0 });
            nextPulseSpawnAt = nowMs + PULSE_INTERVAL_MS;
        }

        for (p = pulses.length - 1; p >= 0; p--) {
            var pulse = pulses[p];
            var rw = ((nowMs - pulse.start) * 0.001) * PULSE_SPEED;

            for (ri = 0; ri < rings.length; ri++) {
                var rGeom = rings[ri].rPct * minDim;
                if (pulse.lastR < rGeom && rw >= rGeom - 0.25) {
                    triggerRingPulse(ri, nowMs);
                }
            }

            if (!pulse.lastTrailSample || nowMs - pulse.lastTrailSample >= TRAIL_SAMPLE_MS) {
                pulse.trail.push({ t: nowMs, r: rw });
                pulse.lastTrailSample = nowMs;
            }
            var keep = [];
            for (i = 0; i < pulse.trail.length; i++) {
                if (nowMs - pulse.trail[i].t < TRAIL_FADE_MS) keep.push(pulse.trail[i]);
            }
            pulse.trail = keep;

            pulse.lastR = rw;
            if (rw > dieR) {
                pulses.splice(p, 1);
            }
        }
    }

    var angles = [];
    function initAngles() {
        angles = [];
        var i;
        for (i = 0; i < rings.length; i++) angles.push(0);
    }
    initAngles();

    var rafId = null;

    function stepOmegas() {
        var i;
        for (i = 0; i < rings.length; i++) {
            var ring = rings[i];
            var rPx = ring.rPct * minDim;
            var target = targetOmegaForRing(ring, rPx);
            ring.omega += (target - ring.omega) * LERP;
        }
    }

    function paint(tSec, nowMs) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        var scale = reducedMotion ? 1 : breatheScale(tSec);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(globalRotation);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);

        var i;
        var p;
        for (i = 0; i < rings.length - 1; i++) {
            var rMid = ((rings[i].rPct + rings[i + 1].rPct) * 0.5) * minDim;
            drawSpacerCircle(rMid, tSec, i, nowMs);
        }

        for (i = 0; i < rings.length; i++) {
            var ring = rings[i];
            var rPx = ring.rPct * minDim;
            drawRing(ring, angles[i], rPx, tSec, i, nowMs);
        }

        if (!reducedMotion) {
            drawPulseTrails(nowMs);
            for (p = 0; p < pulses.length; p++) {
                var rw = ((nowMs - pulses[p].start) * 0.001) * PULSE_SPEED;
                drawPulseWavefront(rw);
            }
        }

        ctx.restore();
    }

    function frame(now) {
        rafId = requestAnimationFrame(frame);
        resize();
        if (w < 2 || h < 2) return;

        var tSec = now * 0.001;
        if (!reducedMotion) {
            stepPulses(now);
        }
        globalRotation += GLOBAL_OMEGA;
        if (globalRotation > TWO_PI) globalRotation -= TWO_PI;
        stepOmegas();
        var i;
        for (i = 0; i < rings.length; i++) {
            angles[i] += rings[i].omega;
        }
        paint(tSec, now);
    }

    function syncSize() {
        resize();
    }

    syncSize();
    requestAnimationFrame(function retry() {
        if (!resize()) {
            requestAnimationFrame(retry);
            return;
        }
        syncSize();
    });

    window.addEventListener('resize', syncSize, { passive: true });

    var roTarget = canvas.parentElement || canvas;
    if (typeof ResizeObserver !== 'undefined') {
        var ro = new ResizeObserver(syncSize);
        ro.observe(roTarget);
    }

    rafId = requestAnimationFrame(frame);

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;
        } else if (!rafId) {
            rafId = requestAnimationFrame(frame);
        }
    });
})();
