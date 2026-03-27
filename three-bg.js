(() => {
    if (window.innerWidth <= 768) return;

    const canvas = document.getElementById('three-bg');
    if (!canvas) return;

    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.zIndex = '0';
    renderer.domElement.style.pointerEvents = 'none';

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 30;
    camera.lookAt(0, 0, -5);

    const shapes = [];

    const geo1 = new THREE.IcosahedronGeometry(3, 1);
    const mat1 = new THREE.MeshBasicMaterial({ color: 0xC8956C, wireframe: true, transparent: true, opacity: 0.09 });
    mat1._origOpacity = 0.09;
    const mesh1 = new THREE.Mesh(geo1, mat1);
    mesh1.position.set(-10, 6, -5);
    scene.add(mesh1);
    shapes.push({ mesh: mesh1, rotX: 0.001, rotY: 0.002, floatAmplitude: 1.0, floatSpeed: 0.4, baseY: 6 });

    const geo2 = new THREE.OctahedronGeometry(2.2);
    const mat2 = new THREE.MeshBasicMaterial({ color: 0xC8956C, wireframe: true, transparent: true, opacity: 0.08 });
    mat2._origOpacity = 0.08;
    const mesh2 = new THREE.Mesh(geo2, mat2);
    mesh2.position.set(12, -4, -8);
    scene.add(mesh2);
    shapes.push({ mesh: mesh2, rotX: 0.0015, rotY: -0.001, floatAmplitude: 0.7, floatSpeed: 0.3, baseY: -4 });

    const geo3 = new THREE.TorusGeometry(2, 0.5, 8, 20);
    const mat3 = new THREE.MeshBasicMaterial({ color: 0xC8956C, wireframe: true, transparent: true, opacity: 0.10 });
    mat3._origOpacity = 0.10;
    const mesh3 = new THREE.Mesh(geo3, mat3);
    mesh3.position.set(8, 8, -12);
    scene.add(mesh3);
    shapes.push({ mesh: mesh3, rotX: 0.002, rotY: 0.003, floatAmplitude: 1.5, floatSpeed: 0.5, baseY: 8 });

    let mouseX = 0;
    let mouseY = 0;

    function onMouseMove(e) {
        mouseX = (e.clientX / window.innerWidth) - 0.5;
        mouseY = (e.clientY / window.innerHeight) - 0.5;
    }

    window._threeShapes = {
        setTheme: (isLight) => {
            /* Canvas + mesh in 0.08–0.1 range — barely visible, atmospheric */
            canvas.style.opacity = isLight ? '0.1' : '0.12';
            shapes.forEach(s => {
                s.mesh.material.opacity = isLight
                    ? s.mesh.material._origOpacity * 0.6
                    : s.mesh.material._origOpacity;
            });
        }
    };

    window._threeShapes.setTheme(
        document.documentElement.getAttribute('data-theme') === 'light'
    );

    const clock = new THREE.Clock();
    let frameCount = 0;
    let animationFrameId;

    const usePerformanceModeDesktop = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

    function renderFrame(t) {
        if (!isReducedMotion && t != null) {
            shapes.forEach(s => {
                s.mesh.rotation.x += s.rotX;
                s.mesh.rotation.y += s.rotY;
                s.mesh.position.y = s.baseY + Math.sin(t * s.floatSpeed) * s.floatAmplitude;
            });
            camera.position.x += (mouseX * 2 - camera.position.x) * 0.02;
            camera.position.y += (mouseY * -1.5 - camera.position.y) * 0.02;
            camera.lookAt(0, 0, -5);
        }
        renderer.render(scene, camera);
    }

    if (isReducedMotion) {
        renderFrame(null);
        return;
    }

    document.addEventListener('mousemove', onMouseMove, { passive: true });

    const loop = () => {
        animationFrameId = requestAnimationFrame(loop);

        if (usePerformanceModeDesktop) {
            frameCount++;
            if (frameCount % 2 !== 0) return;
        }

        const t = clock.getElapsedTime();
        renderFrame(t);
    };

    animationFrameId = requestAnimationFrame(loop);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationFrameId);
        } else {
            clock.getElapsedTime();
            animationFrameId = requestAnimationFrame(loop);
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            cancelAnimationFrame(animationFrameId);
            canvas.style.display = 'none';
            return;
        }
        canvas.style.display = 'block';
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, { passive: true });

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
        window._threeShapes.setTheme(true);
    }
})();
