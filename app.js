document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            try {
                localStorage.setItem('theme', newTheme);
            } catch (e) { /* ignore */ }
            if (window._threeShapes) {
                window._threeShapes.setTheme(newTheme === 'light');
            }
        });
    }

    function escHtml(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/"/g, '&quot;');
    }

    function safeAssetPath(p) {
        return typeof p === 'string' && /^assets\/[a-zA-Z0-9._/-]+$/.test(p) ? p : '';
    }

    const LABEL_CHAR_MS = 28;
    const SESSION_LABEL_PREFIX = 'sectionLabelPrinted:';

    function escapeReForMetrics(s) {
        return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function heroImpactHtml(impact) {
        let s = escHtml(impact);
        const phrases = ['18–25 seconds', '18-25 seconds', '2nd place', '2nd Place'];
        phrases.forEach((phrase) => {
            const re = new RegExp(escapeReForMetrics(phrase), 'gi');
            s = s.replace(re, (m) => `<span class="project-card__metric">${m}</span>`);
        });
        return s;
    }

    function miniVisualKind(p) {
        const id = (p.id || '').toLowerCase();
        if (id === 'aura') return 'aura';
        if (id === 'quill') return 'quill';
        if (id === 'clai') return 'clai';
        if (id === 'compass') return 'compass';
        return 'abstract';
    }

    function buildProjectPillsHtml(p) {
        const parts = [];
        const demo = p.links && String(p.links.demo || '').trim();
        if (demo) {
            parts.push(
                `<a href="${escHtml(demo)}" class="project-pill" target="_blank" rel="noopener">Live Demo →</a>`
            );
        }
        if (p.links && p.links.code) {
            parts.push(
                `<a href="${escHtml(p.links.code)}" class="project-pill" target="_blank" rel="noopener">Code →</a>`
            );
        }
        const writeup = p.links && String(p.links.writeup || '').trim();
        if (writeup) {
            parts.push(
                `<a href="${escHtml(writeup)}" class="project-pill" target="_blank" rel="noopener">Case study →</a>`
            );
        }
        if (!parts.length) return '';
        return `<div class="project-links project-links--pills">${parts.join('')}</div>`;
    }

    function buildMiniVisualHtml(kind) {
        if (kind === 'quill') {
            return '<div class="project-card__mini-visual" aria-hidden="true"><pre class="project-mini-quill"><code></code></pre></div>';
        }
        return '<div class="project-card__mini-visual" aria-hidden="true"><canvas class="project-mini-canvas"></canvas></div>';
    }

    function getNavScrollOffset() {
        const header = document.querySelector('.site-header__pill');
        if (!header) return 96;
        const h = header.getBoundingClientRect().height;
        return Math.ceil(h + 19);
    }

    function getMainScrollRoot() {
        return null;
    }

    let closeMobileNav = () => {};

    function sectionIdToSphereData(id) {
        if (id === 'learning-log') return 'learning-log';
        return id;
    }

    function wasSectionLabelPrinted(id) {
        try {
            return sessionStorage.getItem(SESSION_LABEL_PREFIX + id) === '1';
        } catch (e) {
            return false;
        }
    }

    function markSectionLabelPrinted(id) {
        try {
            sessionStorage.setItem(SESSION_LABEL_PREFIX + id, '1');
        } catch (e) { /* ignore */ }
    }

    function setSphereSectionFromNavId(sectionId) {
        const host = document.querySelector('.sidebar-sphere-host');
        if (!host) return;
        const mapped = sectionIdToSphereData(sectionId);
        host.setAttribute('data-section', mapped);
    }

    let revealIntersectionObserver = null;

    function revealSectionGateOpen(section) {
        return !section || !section.id || section.dataset.labelReady === '1';
    }

    function attachRevealObserver() {
        const mainEl = getMainScrollRoot();
        const isMobile = window.innerWidth <= 768;
        revealIntersectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const sec = entry.target.closest('section[id]');
                if (sec && !revealSectionGateOpen(sec)) return;
                entry.target.classList.add('revealed');
                revealIntersectionObserver.unobserve(entry.target);
            });
        }, {
            root: mainEl,
            rootMargin: isMobile ? '-20px' : '-60px',
            threshold: 0.1
        });
    }

    function observeRevealEl(el) {
        if (!revealIntersectionObserver || el._revealBound) return;
        const sec = el.closest('section[id]');
        if (sec && !revealSectionGateOpen(sec)) return;
        el._revealBound = true;
        revealIntersectionObserver.observe(el);
    }

    function releaseSectionReveals(section) {
        if (!section) return;
        section.querySelectorAll('.reveal').forEach(el => {
            el._revealBound = false;
            observeRevealEl(el);
        });
    }

    function clearSectionLabelTimers(section) {
        const arr = section._labelTimers;
        if (arr && arr.length) {
            arr.forEach(id => clearTimeout(id));
            section._labelTimers = [];
        }
    }

    function completeSectionLabelVisuals(section, labelEl, fullText) {
        if (labelEl) {
            labelEl.textContent = fullText;
            labelEl.classList.add('revealed');
        }
        section.classList.add('section--ungated');
        section.dataset.labelReady = '1';
        section.dataset.labelAnimating = '0';
        markSectionLabelPrinted(section.id);
        releaseSectionReveals(section);
    }

    function flushSectionLabel(section) {
        const labelEl = section.querySelector('.section__label');
        const fullText = section.dataset.labelFull || (labelEl ? labelEl.textContent.trim() : '');
        if (labelEl && !section.dataset.labelFull) section.dataset.labelFull = fullText;
        clearSectionLabelTimers(section);
        completeSectionLabelVisuals(section, labelEl, fullText);
    }

    function runSectionLabelTypewriter(section) {
        const labelEl = section.querySelector('.section__label');
        if (!labelEl) return;
        if (!section.dataset.labelFull) section.dataset.labelFull = labelEl.textContent.trim();
        const fullText = section.dataset.labelFull;
        section.dataset.labelAnimating = '1';
        labelEl.textContent = '';
        section._labelTimers = section._labelTimers || [];
        let i = 0;

        const step = () => {
            if (section.dataset.labelAnimating !== '1') return;
            i += 1;
            labelEl.textContent = fullText.slice(0, i);
            if (i < fullText.length) {
                const tid = setTimeout(step, LABEL_CHAR_MS);
                section._labelTimers.push(tid);
            } else {
                section.dataset.labelAnimating = '0';
                labelEl.classList.add('revealed');
                markSectionLabelPrinted(section.id);
                const tid = setTimeout(() => {
                    section.classList.add('section--ungated');
                    section.dataset.labelReady = '1';
                    releaseSectionReveals(section);
                }, 200);
                section._labelTimers.push(tid);
            }
        };
        step();
    }

    function beginSectionLabelIfNeeded(section) {
        if (!section || !section.id || section.dataset.labelStarted === '1') return;
        section.dataset.labelStarted = '1';

        if (!section.querySelector('.section__label')) {
            flushSectionLabel(section);
            return;
        }

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced || wasSectionLabelPrinted(section.id)) {
            flushSectionLabel(section);
            return;
        }
        runSectionLabelTypewriter(section);
    }

    function initSectionLabelIntersection() {
        const mainEl = getMainScrollRoot();
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        document.querySelectorAll('section[id]').forEach(section => {
            if (reduced) {
                flushSectionLabel(section);
                section.dataset.labelStarted = '1';
            }
        });
        if (reduced) return;

        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const section = entry.target;
                if (!section.id) return;
                if (!entry.isIntersecting) {
                    if (section.dataset.labelAnimating === '1') {
                        flushSectionLabel(section);
                    }
                    return;
                }
                if (entry.intersectionRatio >= 0.15) {
                    beginSectionLabelIfNeeded(section);
                }
            });
        }, {
            root: mainEl,
            threshold: [0, 0.15, 0.5, 1]
        });

        document.querySelectorAll('section[id]').forEach(s => io.observe(s));
    }

    function initScrollNavAndSphere() {
        const mainEl = getMainScrollRoot();
        const navLinks = document.querySelectorAll('.nav-link');
        const sectionVisibility = new Map();

        const applyActiveNav = (bestId) => {
            if (!bestId) return;
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                link.classList.toggle('active', href === `#${bestId}`);
            });
            setSphereSectionFromNavId(bestId);
        };

        const io = new IntersectionObserver(entries => {
            entries.forEach(en => {
                const id = en.target.id;
                if (!id) return;
                if (en.isIntersecting) {
                    sectionVisibility.set(id, en.intersectionRatio);
                } else {
                    sectionVisibility.delete(id);
                }
            });
            let bestId = null;
            let bestR = 0;
            sectionVisibility.forEach((r, id) => {
                if (r > bestR) {
                    bestR = r;
                    bestId = id;
                }
            });
            if (bestId) applyActiveNav(bestId);
        }, {
            root: mainEl,
            rootMargin: '-40% 0px -40% 0px',
            threshold: [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.75, 1]
        });

        document.querySelectorAll('section[id]').forEach(s => io.observe(s));

        const first = document.querySelector('section[id]');
        if (first && first.id) applyActiveNav(first.id);
    }

    function initScrollReveals() {
        const isMobile = window.innerWidth <= 768;
        if (revealIntersectionObserver) {
            revealIntersectionObserver.disconnect();
        }
        attachRevealObserver();

        document.querySelectorAll('.reveal').forEach(el => {
            el._revealBound = false;
            if (isMobile) {
                if (el.classList.contains('from-left')) {
                    el.style.transform = 'translateX(-8px)';
                } else if (!el.classList.contains('scale-in')) {
                    el.style.transform = 'translateY(8px)';
                }
            }
            const sec = el.closest('section[id]');
            if (!sec || revealSectionGateOpen(sec)) {
                observeRevealEl(el);
            }
        });

        if (isMobile) {
            const headerObserver = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        headerObserver.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '-10px', threshold: 0.1 });

            document.querySelectorAll('.section__label').forEach(el => headerObserver.observe(el));
        }
    }

    function initContactEmailShimmer() {
        const link = document.querySelector('.contact__email');
        if (!link || link.dataset.shimmerInit === '1') return;
        link.dataset.shimmerInit = '1';
        const text = link.textContent.trim();
        link.textContent = '';
        [...text].forEach(ch => {
            const s = document.createElement('span');
            s.className = 'contact-email__char';
            s.textContent = ch === ' ' ? '\u00a0' : ch;
            link.appendChild(s);
        });

        let waveLock = false;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const runWave = () => {
            if (reduced) return;
            if (waveLock) return;
            waveLock = true;
            const chars = link.querySelectorAll('.contact-email__char');
            const n = chars.length;
            if (!n) {
                waveLock = false;
                return;
            }
            const stepMs = Math.min(30, Math.max(6, Math.floor(380 / (2 * n))));
            const timers = [];

            const clearHot = () => chars.forEach(c => c.classList.remove('contact-email__char--hot'));

            chars.forEach((c, idx) => {
                timers.push(setTimeout(() => {
                    c.classList.add('contact-email__char--hot');
                }, idx * stepMs));
            });
            const mid = n * stepMs + 80;
            chars.forEach((c, idx) => {
                timers.push(setTimeout(() => {
                    c.classList.remove('contact-email__char--hot');
                }, mid + idx * stepMs));
            });
            timers.push(setTimeout(() => {
                clearHot();
                waveLock = false;
            }, mid + n * stepMs + 50));
        };

        link.addEventListener('mouseenter', runWave);
        link.addEventListener('focus', runWave);
        link.addEventListener('touchstart', runWave, { passive: true });
        link.addEventListener('click', runWave);
    }

    function fillHeroNameChars(container, fullName) {
        if (!container || !fullName) return;
        container.innerHTML = '';
        const words = fullName.trim().split(/\s+/);
        words.forEach((word, wi) => {
            const wordWrap = document.createElement('span');
            wordWrap.className = 'hero-name__word';
            [...word].forEach((ch) => {
                const span = document.createElement('span');
                span.className = 'hero-name__char';
                span.textContent = ch;
                wordWrap.appendChild(span);
            });
            container.appendChild(wordWrap);
            if (wi < words.length - 1) {
                const sp = document.createElement('span');
                sp.className = 'hero-name__space';
                sp.setAttribute('aria-hidden', 'true');
                container.appendChild(sp);
            }
        });
    }

    function runHeroSequence(meta) {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const dev = document.getElementById('hero-mantra-dev');
        const roman = document.getElementById('hero-mantra-roman');
        const nameInner = document.getElementById('hero-name-inner');
        const eyebrow = document.querySelector('.hero-eyebrow');
        const introLines = document.querySelectorAll('.hero-intro__line');
        const statusEl = document.getElementById('hero-status');
        const statusInactive = meta.status && meta.status.active === false;

        const lines = (meta.tagline || '').split('\n');
        if (dev) dev.textContent = lines[0] || '';
        if (roman) roman.textContent = lines[1] || '';
        fillHeroNameChars(nameInner, meta.name || '');

        if (statusEl) {
            statusEl.hidden = !!statusInactive;
        }

        if (reduced || typeof gsap === 'undefined') {
            [dev, roman, eyebrow].forEach((el) => {
                if (el) {
                    el.style.opacity = '1';
                    el.style.transform = 'none';
                }
            });
            introLines.forEach((el) => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            return;
        }

        const chars = nameInner ? nameInner.querySelectorAll('.hero-name__char') : [];

        gsap.set([dev, roman, eyebrow], { opacity: 0, y: 12 });
        gsap.set(introLines, { opacity: 0, y: 14 });
        gsap.set(chars, { yPercent: 110, opacity: 0 });
        if (statusEl && !statusInactive) {
            statusEl.hidden = true;
            gsap.set(statusEl, { autoAlpha: 0 });
        }

        const tl = gsap.timeline();
        tl.to(dev, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, 0.28);
        tl.to(roman, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 0.44);
        tl.to(chars, {
            yPercent: 0,
            opacity: 1,
            stagger: 0.03,
            duration: 0.65,
            ease: 'power2.out'
        }, 0.85);
        const nameEnd = 0.85 + Math.max(0, chars.length - 1) * 0.03 + 0.65;
        tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, nameEnd + 0.04);
        const introTlStart = nameEnd + 0.18;
        tl.to(introLines, {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.14,
            ease: 'power2.out'
        }, introTlStart);
        const introAnimEnd =
            introTlStart + 0.55 + Math.max(0, introLines.length - 1) * 0.14;
        tl.add(() => {
            if (statusEl && !statusInactive) {
                statusEl.hidden = false;
                gsap.fromTo(statusEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power2.out' });
            }
        }, introAnimEnd + 0.12);
    }

    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            renderMeta(data.meta);
            renderProjects(data.projects);
            renderExperience(data.experience);
            renderEducation(data.education);
            renderJournal(data.journal);
            renderContact(data.meta.contact, data.meta.social);
            initMermaid();

            // Apply reveal classes AFTER rendering
            document.querySelectorAll('.project-card:not(.project-card--bento), .journal-entry').forEach(el => {
                el.classList.add('reveal');
            });
            // Apply staggering
            document.querySelectorAll('.projects__list, .experience__list, .education__list, .journal__list').forEach(parent => {
                const reveals = parent.querySelectorAll('.reveal');
                reveals.forEach((el, idx) => {
                    const maxDelay = window.innerWidth <= 768 ? 0.15 : 2; // cap staggering to max seconds
                    el.style.transitionDelay = Math.min((idx * 0.08), maxDelay) + 's';
                });
            });

            initSectionLabelIntersection();
            initScrollNavAndSphere();
            initScrollReveals();
            initCardTilt();
            findAndWrapNumbers();
            initMagneticNav();
            initScrollOpacity();
            initContactEmailShimmer();
            if (typeof window.onYantraIntroDone === 'function') {
                window.onYantraIntroDone(() => runHeroSequence(data.meta));
            } else {
                runHeroSequence(data.meta);
            }
        })
        .catch(err => {
            console.error(err);
            const main = document.querySelector('main');
            if (main) {
                main.innerHTML = '<div style="text-align: center; margin-top: 50vh;">Portfolio loading — check back soon.</div>';
            }
        });

    function renderMeta(meta) {
        const gh = document.getElementById('social-github');
        if (gh) gh.href = meta.social.github;
        const li = document.getElementById('social-linkedin');
        if (li) li.href = meta.social.linkedin;
        const em = document.getElementById('social-email');
        if (em) em.href = "mailto:" + meta.social.email;
    }

    function renderProjects(projects) {
        const container = document.querySelector('.projects__list');
        if (!container) return;

        container.replaceChildren();

        const sorted = [...projects].sort((a, b) => {
            if (a.type === 'hero') return -1;
            if (b.type === 'hero') return 1;
            return 0;
        });

        const heroP = sorted.find(p => p.type === 'hero');
        const rest = sorted.filter(p => p.type !== 'hero');
        const oddLast = rest.length % 2 === 1;

        const renderHeroCard = (p) => {
            let pipelineHtml = '';
            if (p.aiMeta && p.aiMeta.pipeline) {
                const stages = p.aiMeta.pipeline.split('→').map(s => s.trim()).filter(Boolean);
                pipelineHtml = '<div class="pipeline-badge">';
                stages.forEach((s, idx) => {
                    pipelineHtml += `<span class="pipeline-stage metadata active">${s}</span>`;
                    if (idx < stages.length - 1) {
                        pipelineHtml += `<span class="pipeline-arrow">→</span>`;
                    }
                });
                pipelineHtml += '</div>';
            }

            let linksHtml = buildProjectPillsHtml(p);
            if (p.aiMeta && p.aiMeta.hasPlayground && String(p.aiMeta.playgroundUrl || '').trim()) {
                const u = escHtml(String(p.aiMeta.playgroundUrl).trim());
                const pg = `<a class="playground-btn project-pill" href="${u}" target="_blank" rel="noopener">Try the Model →</a>`;
                if (linksHtml) {
                    linksHtml = linksHtml.replace(/<\/div>\s*$/, `${pg}</div>`);
                } else {
                    linksHtml = `<div class="project-links project-links--pills">${pg}</div>`;
                }
            }

            let techHtml = '<div class="tech-row tech-stack">';
            (p.tech || []).forEach(t => { techHtml += `<span class="tech-tag tag">${escHtml(t)}</span>`; });
            techHtml += '</div>';

            const diagramHtml = p.diagram ? `
                    <div class="diagram-section">
                        <button class="diagram-toggle" aria-expanded="false">
                            <span class="diagram-toggle__caret">+</span> architecture
                        </button>
                        <div class="diagram-container">
                            <div class="mermaid">${p.diagram}</div>
                        </div>
                    </div>` : '';

            const heroImg = safeAssetPath(p.image);
            const figureHtml = heroImg
                ? `<figure class="project-card__figure project-card__figure--parallax"><img src="${escHtml(heroImg)}" alt="" loading="lazy" decoding="async" /></figure>`
                : '<div class="project-card__figure project-card__figure--placeholder" role="presentation" aria-hidden="true"></div>';

            const shell = document.createElement('div');
            shell.className = 'projects__featured-shell';
            const conic = document.createElement('div');
            conic.className = 'projects__featured-conic';
            conic.setAttribute('aria-hidden', 'true');

            const card = document.createElement('div');
            card.className = 'project-card hero project-card--featured';
            card.setAttribute('data-tilt', '');

            card.innerHTML = `
                    <div class="project__tilt-shine"></div>
                    <div class="project-card__hero-layout">
                        ${figureHtml}
                        <div class="project-card__hero-copy">
                            <h3 class="project-card__title">${escHtml(p.title)}</h3>
                            <p class="project-card__impact">${heroImpactHtml(p.impact)}</p>
                        </div>
                    </div>
                    <div class="case-study">
                        <div class="case-study__block"><span class="case-study__label">Problem</span><span class="case-study__body">${escHtml(p.problem)}</span></div>
                        <div class="case-study__block"><span class="case-study__label">Approach</span><span class="case-study__body">${escHtml(p.approach)}</span></div>
                        <div class="case-study__block"><span class="case-study__label">Impact</span><span class="case-study__body">${escHtml(p.impact)}</span></div>
                        <div class="case-study__block"><span class="case-study__label">Reflection</span><span class="case-study__body">${escHtml(p.reflection)}</span></div>
                    </div>
                    ${techHtml}
                    ${pipelineHtml}
                    ${diagramHtml}
                    ${linksHtml}
                `;

            if (window.innerWidth <= 768) {
                card.addEventListener('touchstart', () => {
                    card.style.transform = 'scale(0.98)';
                    card.style.background = 'var(--bg-card)';
                    card.style.transition = 'transform 0.15s ease, background 0.15s ease';
                }, { passive: true });
                card.addEventListener('touchend', () => {
                    card.style.transform = 'scale(1)';
                    card.style.transition = 'transform 0.2s ease, background 0.2s ease';
                });
            }

            shell.appendChild(conic);
            shell.appendChild(card);
            container.appendChild(shell);
            bindDiagramToggle(card);
        };

        if (heroP) {
            renderHeroCard(heroP);
        }

        const bento = document.createElement('div');
        bento.className = 'projects__bento';

        rest.forEach((p, idx) => {
            const spanFull = oddLast && idx === rest.length - 1;
            const card = document.createElement('article');
            card.className =
                'project-card standard project-card--bento' +
                (spanFull ? ' project-card--bento-span-full' : '');
            card.setAttribute('data-tilt', '');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-expanded', 'false');

            const kind = miniVisualKind(p);
            card.setAttribute('data-mini-visual', kind);
            const miniHtml = buildMiniVisualHtml(kind);

            const linksHtml = buildProjectPillsHtml(p);

            let playgroundHtml = '';
            if (p.aiMeta && p.aiMeta.hasPlayground && String(p.aiMeta.playgroundUrl || '').trim()) {
                const u = escHtml(String(p.aiMeta.playgroundUrl).trim());
                playgroundHtml = `<a class="playground-btn project-pill" href="${u}" target="_blank" rel="noopener">Try the Model →</a>`;
            }

            let techHtml = '<div class="tech-row tech-stack">';
            (p.tech || []).forEach(t => { techHtml += `<span class="tech-tag tag">${escHtml(t)}</span>`; });
            techHtml += '</div>';

            const stdDiagramHtml = p.diagram ? `
                    <div class="diagram-section">
                        <button class="diagram-toggle" aria-expanded="false">
                            <span class="diagram-toggle__caret">+</span> architecture
                        </button>
                        <div class="diagram-container">
                            <div class="mermaid">${p.diagram}</div>
                        </div>
                    </div>` : '';

            card.innerHTML = `
                    <div class="project__tilt-shine"></div>
                    <div class="project-card__bento-glow"></div>
                    ${miniHtml}
                    <div class="project-card__bento-body">
                        <div class="project-card__header project-card__header--bento">
                            <div class="project-card__header-main">
                                <h3 class="project-card__title project-card__title--bento">${escHtml(p.title)}</h3>
                                <span class="project-card__chevron">▾</span>
                            </div>
                        </div>
                        <p class="project-card__impact">${escHtml(p.impact)}</p>
                        ${techHtml}
                        ${linksHtml}
                        <div class="project-card__expand">
                            <div class="project-card__expand-inner">
                                <div class="case-study" style="margin-top: 16px;">
                                    <div class="case-study__block"><span class="case-study__label">Problem</span><span class="case-study__body">${escHtml(p.problem)}</span></div>
                                    <div class="case-study__block"><span class="case-study__label">Approach</span><span class="case-study__body">${escHtml(p.approach)}</span></div>
                                    <div class="case-study__block"><span class="case-study__label">Reflection</span><span class="case-study__body">${escHtml(p.reflection)}</span></div>
                                </div>
                                ${stdDiagramHtml}
                                ${playgroundHtml}
                            </div>
                        </div>
                    </div>
                `;

            const toggleExpand = () => {
                const expanded = card.getAttribute('aria-expanded') === 'true';
                card.setAttribute('aria-expanded', !expanded);
            };
            card.addEventListener('click', toggleExpand);
            card.querySelectorAll('a.project-pill, a.playground-btn').forEach((a) => {
                a.addEventListener('click', (e) => e.stopPropagation());
            });
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand();
                }
            });

            if (window.innerWidth <= 768) {
                card.addEventListener('touchstart', () => {
                    card.style.transform = 'scale(0.98)';
                    card.style.background = 'var(--bg-card)';
                    card.style.transition = 'transform 0.15s ease, background 0.15s ease';
                }, { passive: true });
                card.addEventListener('touchend', () => {
                    card.style.transform = 'scale(1)';
                    card.style.transition = 'transform 0.2s ease, background 0.2s ease';
                });
            }

            bento.appendChild(card);
            bindDiagramToggle(card);
        });

        container.appendChild(bento);

        if (typeof window.initPortfolioProjectEffects === 'function') {
            window.initPortfolioProjectEffects();
        }

        if (window.innerWidth <= 768) {
            const heroCard = container.querySelector('.project-card.hero');
            if (heroCard) {
                const caseStudy = heroCard.querySelector('.case-study');
                if (caseStudy) {
                    caseStudy.style.display = 'none';
                    heroCard.setAttribute('aria-expanded', 'false');
                    heroCard.style.cursor = 'pointer';
                    heroCard.addEventListener('click', () => {
                        const expanded = heroCard.getAttribute('aria-expanded') === 'true';
                        heroCard.setAttribute('aria-expanded', String(!expanded));
                        caseStudy.style.display = expanded ? 'none' : 'block';
                    });
                }
            }
        }
    }

    function renderJournal(journal) {
        const container = document.querySelector('.journal__list');
        if (!container) return;

        journal.forEach(j => {
            const article = document.createElement('article');
            article.className = 'journal-entry';

            const date = new Date(j.date);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            let tagsHtml = '<div class="journal-entry__tags">';
            (j.tags || []).forEach(t => tagsHtml += `<span class="journal-tag tag">${t}</span>`);
            tagsHtml += '</div>';

            let contentHtml = j.content
                .replace(/### (.*?)\n/g, '<h4>$1</h4>')
                .replace(/## (.*?)\n/g, '<h3>$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
                .replace(/`([^`\n]+)`/g, '<code>$1</code>')
                .replace(/- (.*?)(\n|$)/g, '<li>$1</li>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
                .replace(/\n\n/g, '</p><p>');

            contentHtml = '<p>' + contentHtml + '</p>';
            contentHtml = contentHtml.replace(/(<li>.*?<\/li>)+/gs, match => `<ul>${match}</ul>`);

            article.innerHTML = `
                <div class="journal-entry__meta"><span class="journal-entry__date dates">${dateStr}</span></div>
                <h3 class="journal-entry__title">${j.title}</h3>
                <p class="journal-entry__summary">${j.summary}</p>
                ${tagsHtml}
                <div class="journal-entry__content">
                    <div class="journal-entry__body">${contentHtml}</div>
                </div>
            `;

            article.addEventListener('click', () => {
                article.classList.toggle('expanded');
            });

            if (window.innerWidth <= 768) {
                article.addEventListener('touchstart', () => {
                    article.style.transform = 'scale(0.98)';
                    article.style.background = 'var(--bg-card)';
                    article.style.transition = 'transform 0.15s ease, background 0.15s ease';
                }, { passive: true });
                article.addEventListener('touchend', () => {
                    article.style.transform = 'scale(1)';
                    article.style.transition = 'transform 0.2s ease, background 0.2s ease';
                    // Reset overrides on end to allow hover class
                    setTimeout(() => {
                        if (article.style.transform === 'scale(1)') {
                            article.style.transform = '';
                            article.style.background = '';
                        }
                    }, 200);
                });
            }

            container.appendChild(article);
        });
    }

    function renderExperience(exp) {
        const container = document.querySelector('.experience__list');
        if (!container) return;

        exp.forEach(e => {
            const article = document.createElement('article');
            article.className = 'exp-card reveal from-left';

            let techHtml = '<div class="tech-row tech-stack">';
            (e.tech || []).forEach(t => techHtml += `<span class="tech-tag tag">${t}</span>`);
            techHtml += '</div>';

            article.innerHTML = `
                <p class="exp-card__period dates">${e.period}</p>
                <h3 class="exp-card__role">${e.role}</h3>
                <p class="exp-card__company">${e.company}</p>
                <p class="exp-card__description">${e.description}</p>
                ${techHtml}
            `;
            container.appendChild(article);
        });
    }

    function renderEducation(edu) {
        const container = document.querySelector('.education__list');
        if (!container) return;

        edu.forEach(e => {
            const article = document.createElement('article');
            article.className = 'edu-card reveal scale-in';

            article.innerHTML = `
                <h3 class="edu-card__degree">${e.degree}</h3>
                <p class="edu-card__school">${e.school} <span class="edu-card__year stat-label">(${e.year})</span></p>
                <p class="edu-card__detail">${e.detail}</p>
            `;
            container.appendChild(article);
        });
    }

    function renderContact(contactMsg, social) {
        const container = document.querySelector('.contact__content');
        if (!container) return;

        container.innerHTML = `
            <p class="contact__message">${contactMsg}</p>
            <a href="mailto:${social.email}" class="contact__email">${social.email}</a>
            <div class="contact__socials">
                <a href="${social.github}" target="_blank" rel="noopener">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                </a>
                <a href="${social.linkedin}" target="_blank" rel="noopener">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
            </div>
            <p class="contact__footer">Built with vanilla JS and unreasonable attention to detail</p>
        `;
    }

    function initNavDrawer() {
        const header = document.querySelector('.site-header');
        const toggle = document.querySelector('.nav-toggle');
        const backdrop = document.getElementById('nav-backdrop');
        const nav = document.getElementById('site-nav');
        if (!header || !toggle || !nav) return;

        function setOpen(open) {
            header.classList.toggle('site-header--nav-open', open);
            document.body.classList.toggle('nav-drawer-open', open);
            if (backdrop) {
                backdrop.classList.toggle('is-visible', open);
                backdrop.tabIndex = open ? 0 : -1;
            }
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        }

        function close() {
            setOpen(false);
        }

        closeMobileNav = close;

        toggle.addEventListener('click', () => {
            setOpen(!header.classList.contains('site-header--nav-open'));
        });

        if (backdrop) {
            backdrop.addEventListener('click', close);
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && header.classList.contains('site-header--nav-open')) {
                close();
                toggle.focus();
            }
        });
    }

    initNavDrawer();

    function smoothScrollTo(targetY, duration = 600) {
        const startY = window.scrollY;
        const distance = targetY - startY;
        const startTime = performance.now();

        const easeInOutCubic = t =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            window.scrollTo(0, startY + distance * easeInOutCubic(progress));
            if (progress < 1) requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                const offset = getNavScrollOffset();
                const targetY = target.getBoundingClientRect().top + window.scrollY - offset;
                smoothScrollTo(Math.max(0, targetY), 650);
            }
            if (window.innerWidth <= 768) closeMobileNav();
        });

        if (window.innerWidth <= 768) {
            anchor.addEventListener('touchstart', () => {
                anchor.style.transform = 'scale(0.95)';
                anchor.style.transition = 'transform 0.15s ease';
            }, { passive: true });
            anchor.addEventListener('touchend', () => {
                anchor.style.transform = 'scale(1)';
                anchor.style.transition = 'transform 0.2s ease';
                setTimeout(() => { if (anchor.style.transform === 'scale(1)') anchor.style.transform = ''; }, 200);
            });
        }
    });

    // --- Animations and Scroll Observers ---

    function initScrollOpacity() {
        // Disabled — dims content and hurts readability
        return;
    }

    function initCardTilt() {
        if (window.innerWidth <= 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        document.querySelectorAll('[data-tilt]').forEach(card => {
            let shine = card.querySelector('.project__tilt-shine');
            if (!shine) {
                shine = document.createElement('div');
                shine.className = 'project__tilt-shine';
                card.insertBefore(shine, card.firstChild);
            }

            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const offsetX = (x - centerX) / centerX;
                const offsetY = (y - centerY) / centerY;

                const isBento = card.classList.contains('project-card--bento');
                const isStandard = card.classList.contains('standard');
                const isHero = card.classList.contains('hero');
                const lift = isHero ? -4 : isBento ? -3 : isStandard ? -5 : -3;
                const rotX = offsetY * (isBento ? -3 : isStandard ? -4 : -3);
                const rotY = offsetX * (isBento ? 3 : isStandard ? 4 : 3);
                const sc = isBento ? 1.003 : isStandard ? 1.004 : 1.01;

                card.style.transform =
                    `perspective(900px) translateY(${lift}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${sc})`;
                const posX = (x / rect.width) * 100;
                const posY = (y / rect.height) * 100;
                shine.style.background =
                    `radial-gradient(circle at ${posX}% ${posY}%, rgba(207,159,114,0.14) 0%, rgba(175,186,202,0.08) 38%, transparent 58%)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1)';
                shine.style.background = '';
            });

            card.addEventListener('mouseenter', () => {
                card.style.transition = 'transform 0.1s ease';
            });
        });
    }

    const scrollProgress = document.querySelector('.scroll-progress');
    window.addEventListener('scroll', () => {
        const el = document.documentElement;
        const totalScroll = el.scrollTop;
        const windowHeight = el.scrollHeight - el.clientHeight;
        const pct = windowHeight <= 0 ? 0 : (totalScroll / windowHeight) * 100;
        if (scrollProgress) scrollProgress.style.width = `${pct}%`;
    }, { passive: true });

    // Single RAF loop for spotlight interpolation
    const spotlight = document.querySelector('.spotlight');
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;
    let targetX = currentX;
    let targetY = currentY;
    let animationFrameId;

    if (spotlight && window.innerWidth > 768 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.addEventListener('mousemove', e => {
            targetX = e.clientX;
            targetY = e.clientY;
        }, { passive: true });

        document.addEventListener('mouseenter', () => {
            spotlight.style.opacity = '1';
        });

        document.addEventListener('mouseleave', () => {
            spotlight.style.opacity = '0';
        });

        const loop = () => {
            currentX += (targetX - currentX) * 0.08;
            currentY += (targetY - currentY) * 0.08;
            spotlight.style.left = currentX + 'px';
            spotlight.style.top = currentY + 'px';

            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);
    }

    function initMagneticNav() {
        if (window.innerWidth <= 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const navLinks = document.querySelectorAll('.nav-link');
        const header = document.querySelector('.site-header');

        if (!header) return;

        header.addEventListener('mousemove', e => {
            navLinks.forEach(link => {
                const rect = link.getBoundingClientRect();
                const linkCenterX = rect.left + rect.width / 2;
                const linkCenterY = rect.top + rect.height / 2;

                const dx = e.clientX - linkCenterX;
                const dy = e.clientY - linkCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 80) {
                    const strength = 1 - (distance / 80);
                    link.style.transform = `translateX(${dx * strength * 0.3}px) translateY(${dy * strength * 0.3}px)`;
                    link.style.transition = 'transform 0.15s ease';
                } else {
                    link.style.transform = '';
                    link.style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1)';
                }
            });
        });

        document.addEventListener('mouseleave', () => {
            navLinks.forEach(link => {
                link.style.transform = '';
                link.style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1)';
            });
        });
    }

    function bindDiagramToggle(card) {
        const btn = card.querySelector('.diagram-toggle');
        const container = card.querySelector('.diagram-container');
        if (!btn || !container) return;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', String(!expanded));
            container.classList.toggle('open', !expanded);
        });
    }

    function initMermaid() {
        const nodes = document.querySelectorAll('.mermaid');
        if (!nodes.length) return;

        const mermaidConfig = {
            startOnLoad: false,
            theme: 'dark',
            themeVariables: {
                darkMode: true,
                background: '#111111',
                primaryColor: '#1a1a1a',
                primaryTextColor: '#f5f0e8',
                primaryBorderColor: '#c9956a',
                lineColor: '#6b6560',
                secondaryColor: '#111111',
                tertiaryColor: '#1a1a1a',
                edgeLabelBackground: '#0d0d0d',
                clusterBkg: '#1a1a1a',
                fontFamily: "'Monaspace Argon', monospace",
                fontSize: '12px',
                nodeBorder: '#c9956a',
                mainBkg: '#1a1a1a',
            }
        };

        const runMermaid = () => {
            mermaid.initialize(mermaidConfig);
            mermaid.run({ nodes: Array.from(nodes) })
                .then(() => bindDiagramLightbox())
                .catch(() => bindDiagramLightbox());
        };

        if (typeof mermaid !== 'undefined') {
            runMermaid();
        } else {
            window.addEventListener('load', () => {
                if (typeof mermaid !== 'undefined') runMermaid();
            }, { once: true });
        }
    }

    function bindDiagramLightbox() {
        // Create modal once
        if (!document.getElementById('diagram-modal')) {
            const modal = document.createElement('div');
            modal.id = 'diagram-modal';
            modal.className = 'diagram-modal';
            modal.innerHTML = `
                <div class="diagram-modal__backdrop"></div>
                <div class="diagram-modal__content">
                    <button class="diagram-modal__close" aria-label="Close">&#x2715;</button>
                    <div class="diagram-modal__svg"></div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('.diagram-modal__backdrop')
                .addEventListener('click', closeDiagramModal);
            modal.querySelector('.diagram-modal__close')
                .addEventListener('click', closeDiagramModal);
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeDiagramModal();
            });
        }

        // Add zoom-in cursor and click handler to every rendered diagram
        document.querySelectorAll('.diagram-container .mermaid svg').forEach(svg => {
            const wrapper = svg.closest('.mermaid');
            if (wrapper._lightboxBound) return;
            wrapper._lightboxBound = true;
            wrapper.style.cursor = 'zoom-in';
            wrapper.addEventListener('click', () => {
                const clone = svg.cloneNode(true);
                clone.removeAttribute('width');
                clone.removeAttribute('height');
                clone.style.width = '100%';
                clone.style.height = 'auto';
                openDiagramModal(clone);
            });
        });
    }

    function openDiagramModal(svgEl) {
        const modal = document.getElementById('diagram-modal');
        if (!modal) return;
        modal.querySelector('.diagram-modal__svg').replaceChildren(svgEl);
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeDiagramModal() {
        const modal = document.getElementById('diagram-modal');
        if (!modal) return;
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    function findAndWrapNumbers() {
        const targets = document.querySelectorAll('.project-card__impact, .case-study__body, .exp-card__description');
        const regex = /(\d+(?:\.\d+)?)\s*(ms|s|min|%|K\+|k\+|\+|x|hrs?|days?|seconds?|minutes?)/gi;

        targets.forEach(el => {
            if (el.innerHTML.includes('count-up')) return;
            const text = el.innerHTML;
            const newText = text.replace(regex, (match, num, unit) => {
                const space = match.substring(num.length, match.length - unit.length);
                const suffix = space + unit;
                return `<span class="count-up" data-target="${num}" data-suffix="${suffix}">0</span>`;
            });
            if (newText !== text) {
                el.innerHTML = newText;
            }
        });

        const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;

                    const targetVal = parseFloat(el.getAttribute('data-target'));
                    const suffix = el.getAttribute('data-suffix') || '';

                    if (isReducedMotion) {
                        el.innerText = targetVal + suffix;
                        observer.unobserve(el);
                        return;
                    }

                    const duration = targetVal > 100 ? 1200 : 800;
                    let startTime = null;

                    const easeOutQuart = t => 1 - Math.pow(1 - t, 4);

                    const animate = (time) => {
                        if (!startTime) startTime = time;
                        const elapsed = time - startTime;
                        let progress = elapsed / duration;

                        if (progress > 1) progress = 1;

                        const val = easeOutQuart(progress) * targetVal;
                        el.innerText = (targetVal % 1 !== 0 ? val.toFixed(1) : Math.round(val)) + suffix;

                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        } else {
                            el.innerText = targetVal + suffix;
                        }
                    };
                    requestAnimationFrame(animate);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('.count-up').forEach(el => {
            // Wait for reveal transition to end to prevent observer firing from pre-reveal coordinate shifts if any
            observer.observe(el);
        });
    }
});
