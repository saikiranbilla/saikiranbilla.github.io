(() => {
    if (window.innerWidth <= 768) return;

    const canvas = document.getElementById('sidebar-shape');
    if (!canvas) return;

    const host = canvas.parentElement && canvas.parentElement.classList.contains('sidebar-sphere-host')
        ? canvas.parentElement
        : null;

    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // RENDERER & SIZING INITS
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height); // Native aspect fix

    // SCENE & CAMERA
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4; // Moved closer
    camera.lookAt(0, 0, 0);

    // SHAPE
    const geometry = new THREE.IcosahedronGeometry(1.1, 1); // Reduced from 1.8 to 1.1
    const material = new THREE.MeshBasicMaterial({
        color: 0xC8956C,
        wireframe: true,
        transparent: true,
        opacity: document.documentElement.getAttribute('data-theme') === 'light' ? 0.30 : 0.55
    });

    const opacities = {
        dark: 0.55,
        light: 0.30,
        hover: 0.80
    };

    let targetOpacity = material.opacity;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // --- CSS-driven spin period (seconds per full Y revolution); ease over ~2s on change ---
    function readTargetOmega() {
        if (!host) return (2 * Math.PI) / 40;
        const raw = getComputedStyle(host).getPropertyValue('--sidebar-period').trim();
        const p = parseFloat(raw);
        const sec = Number.isFinite(p) && p > 0 ? p : 40;
        return (2 * Math.PI) / sec;
    }

    let omegaStableTarget = readTargetOmega();
    let omegaTo = omegaStableTarget;
    let currentOmega = omegaTo;
    let omegaBlendStart = null;
    let omegaFrom = currentOmega;

    // INTERACTION STATE
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let velocityX = 0;
    let velocityY = 0;

    const dragStart = (x, y) => {
        isDragging = true;
        lastX = x;
        lastY = y;
    };

    const dragMove = (x, y) => {
        if (!isDragging) return;
        const deltaX = x - lastX;
        const deltaY = y - lastY;

        velocityX = deltaX * 0.01;
        velocityY = deltaY * 0.01;

        mesh.rotation.y += velocityX;
        mesh.rotation.x += velocityY;

        lastX = x;
        lastY = y;
    };

    const dragEnd = () => {
        isDragging = false;
        updateHoverState();
    };

    // MOUSE EVENTS
    canvas.addEventListener('mousedown', (e) => dragStart(e.clientX, e.clientY));
    document.addEventListener('mousemove', (e) => dragMove(e.clientX, e.clientY));
    document.addEventListener('mouseup', dragEnd);

    // TOUCH EVENTS
    canvas.addEventListener('touchstart', (e) => dragStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            e.preventDefault();
        }
        dragMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    document.addEventListener('touchend', dragEnd);

    // HOVER OPACITY
    let isHovered = false;

    const updateHoverState = () => {
        if (isHovered || isDragging) {
            targetOpacity = opacities.hover;
        } else {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            targetOpacity = isLight ? opacities.light : opacities.dark;
        }
    };

    canvas.addEventListener('mouseenter', () => {
        isHovered = true;
        updateHoverState();
    });

    canvas.addEventListener('mouseleave', () => {
        isHovered = false;
        if (!isDragging) dragEnd();
        updateHoverState();
    });

    // THEME INTEGRATION
    const originalSetTheme = window._threeShapes ? window._threeShapes.setTheme : null;
    window._threeShapes = window._threeShapes || {};
    window._threeShapes.setTheme = (isLight) => {
        if (originalSetTheme) originalSetTheme(isLight);
        if (!isHovered && !isDragging) {
            targetOpacity = isLight ? opacities.light : opacities.dark;
        }
    };

    let lastFrameTime = performance.now();

    // ANIMATION LOOP
    let animationFrameId;

    const loop = (now) => {
        animationFrameId = requestAnimationFrame(loop);
        const delta = Math.min(0.05, (now - lastFrameTime) / 1000);
        lastFrameTime = now;

        if (Math.abs(material.opacity - targetOpacity) > 0.001) {
            material.opacity += (targetOpacity - material.opacity) * 0.1;
        }

        const desiredOmega = readTargetOmega();

        if (omegaBlendStart !== null) {
            const u = Math.min(1, (now - omegaBlendStart) / 2000);
            const ease = 1 - (1 - u) * (1 - u);
            currentOmega = omegaFrom + (omegaTo - omegaFrom) * ease;
            if (u >= 1) {
                currentOmega = omegaTo;
                omegaBlendStart = null;
                omegaStableTarget = omegaTo;
            }
        }

        if (omegaBlendStart === null && Math.abs(desiredOmega - omegaStableTarget) > 1e-7) {
            omegaFrom = currentOmega;
            omegaTo = desiredOmega;
            omegaStableTarget = desiredOmega;
            omegaBlendStart = performance.now();
        }

        if (!isDragging) {
            if (Math.abs(velocityX) + Math.abs(velocityY) > 0.0001) {
                if (!isReducedMotion) {
                    velocityX *= 0.92;
                    velocityY *= 0.92;
                    mesh.rotation.y += velocityX;
                    mesh.rotation.x += velocityY;
                } else {
                    velocityX = 0;
                    velocityY = 0;
                }
            } else {
                if (!isReducedMotion) {
                    mesh.rotation.y += currentOmega * delta;
                    mesh.rotation.x += currentOmega * 0.25 * delta;
                }
            }
        }

        renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(loop);

    // PAUSE WHEN HIDDEN
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationFrameId);
        } else {
            lastFrameTime = performance.now();
            animationFrameId = requestAnimationFrame(loop);
        }
    });

    // RESIZE HANDLER - using ResizeObserver on the local canvas element
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const w = entry.contentRect.width;
            const h = entry.contentRect.height;
            if (w && h) {
                renderer.setSize(w, h); // Do not pass false here to fix resolution density
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            }
        }
    });
    resizeObserver.observe(canvas);

})();
