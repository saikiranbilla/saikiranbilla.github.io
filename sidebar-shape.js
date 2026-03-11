(() => {
    if (window.innerWidth <= 768) return;

    const canvas = document.getElementById('sidebar-shape');
    if (!canvas) return;

    const isReducedMotion = false; // window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    // ANIMATION LOOP
    let animationFrameId;

    const loop = () => {
        animationFrameId = requestAnimationFrame(loop);

        if (Math.abs(material.opacity - targetOpacity) > 0.001) {
            material.opacity += (targetOpacity - material.opacity) * 0.1;
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
                    mesh.rotation.y += 0.004;
                    mesh.rotation.x += 0.001;
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
