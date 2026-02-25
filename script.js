document.addEventListener('DOMContentLoaded', async function () {

    // ─────────────────────────────────────────────────────────
    // Theme Management
    // ─────────────────────────────────────────────────────────
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn?.querySelector('i');

    // Initialize theme from local storage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (themeIcon) themeIcon.setAttribute('data-lucide', 'moon');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');

            // Save preference
            localStorage.setItem('theme', isLight ? 'light' : 'dark');

            // Swap icon
            if (themeIcon) {
                themeIcon.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
                lucide.createIcons({ root: themeToggleBtn });
            }
        });
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    const API_URL = 'data.json';
    let portfolioData = null;

    try {
        const response = await fetch(API_URL);
        portfolioData = await response.json();
        renderSkeleton(portfolioData);
    } catch (error) {
        console.error('Error loading portfolio data:', error);
    }

    // ─────────────────────────────────────────────────────────
    // Skeleton orchestrator
    // ─────────────────────────────────────────────────────────
    function renderSkeleton(data) {
        renderProfile(data.profile);
        renderHighlights(data.highlights);
        renderFeed('projects', data);

        const dmInput = document.getElementById('dm-input');
        if (dmInput && data.profile.name) {
            dmInput.placeholder = `DM ${data.profile.name}...`;
        }

        setupTabs(data);
    }

    // ─────────────────────────────────────────────────────────
    // Profile header
    // ─────────────────────────────────────────────────────────
    function renderProfile(profile) {
        const container = document.getElementById('profile-container');
        if (!container) return;

        // Calculate stats dynamically based on incoming full data context
        // We'll need to count these arrays if they exist, or default to 0
        const projectCount = typeof portfolioData.projects !== 'undefined' ? portfolioData.projects.length : 0;
        const expCount = typeof portfolioData.experience !== 'undefined' ? portfolioData.experience.length : 0;
        const eduCount = typeof portfolioData.education !== 'undefined' ? portfolioData.education.length : 0;

        container.innerHTML = `
            <div class="profile-top-row fade-in delay-1">
                <div class="profile-avatar-container" id="profilePic" title="View Story">
                    <div class="profile-ring">
                        <img src="files/about-me.jpg" alt="${profile.name}">
                    </div>
                </div>
                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-num">${projectCount}</span>
                        <span class="stat-label">Projects</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-num">${expCount}</span>
                        <span class="stat-label">Experience</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-num">${eduCount}</span>
                        <span class="stat-label">Education</span>
                    </div>
                </div>
            </div>

            <div class="profile-bio-section fade-in delay-2">
                <h2>${profile.name}</h2>
                <p>${profile.bio}</p>
                ${profile.location ? `<span style="display: flex; align-items: center; color: var(--text-secondary);"><i data-lucide="map-pin" style="width: 14px; height: 14px; margin-right: 4px;"></i> ${profile.location}</span>` : ''}
                <div class="profile-icons">
                    ${profile.githubUrl ? `<a href="${profile.githubUrl}" target="_blank" rel="noopener" aria-label="GitHub"><i class="ri-github-fill"></i></a>` : ''}
                    <a href="${profile.linkedinUrl}" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="ri-linkedin-fill"></i></a>
                    ${profile.emailUrl ? `<a href="${profile.emailUrl}" aria-label="Email"><i class="ri-mail-line"></i></a>` : ''}
                </div>
            </div>

            <div class="profile-actions fade-in delay-3">
                <a href="${profile.linkedinUrl}" target="_blank" rel="noopener" class="profile-btn-primary">
                    Message on LinkedIn
                </a>
            </div>
        `;

        const profilePic = document.getElementById('profilePic');
        if (profilePic) {
            profilePic.addEventListener('click', openStory);
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons({ root: container });
        }
    }

    // ─────────────────────────────────────────────────────────
    // Story rings
    // ─────────────────────────────────────────────────────────
    function renderHighlights(highlights) {
        const container = document.getElementById('highlights-container');
        if (!container) return;

        container.innerHTML = highlights.map(h => `
            <div class="highlight-item reveal" data-highlight-id="${h.id}">
                <div class="story-ring">
                    <i data-lucide="${h.icon || 'zap'}" class="story-icon"></i>
                </div>
                <span class="highlight-label">${h.title}</span>
            </div>
        `).join('');

        lucide.createIcons({ root: container });

        container.querySelectorAll('.highlight-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.getAttribute('data-highlight-id');
                const data = highlights.find(h => h.id === id);
                if (data) {
                    // Map highlight skills to story slides
                    const slidesData = data.skills.map(skill => ({
                        label: skill.name,
                        caption: skill.context,
                        bg: 'linear-gradient(160deg, #1f1f1f, #2e2e2e)' // basic fallback
                    }));
                    openStory(slidesData);
                }
            });
        });
    }

    // ─────────────────────────────────────────────────────────
    // Tab switching
    // ─────────────────────────────────────────────────────────
    function setupTabs(data) {
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', () => {
                if (tab.classList.contains('active')) return;

                document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const container = document.getElementById('feed-container');
                if (container) {
                    container.classList.add('fade-out');
                    setTimeout(() => {
                        renderFeed(tab.getAttribute('data-tab'), data);
                        container.classList.remove('fade-out');
                    }, 200);
                } else {
                    renderFeed(tab.getAttribute('data-tab'), data);
                }
            });
        });
    }

    // ─────────────────────────────────────────────────────────
    // Carousel builder
    // ─────────────────────────────────────────────────────────
    function renderCarousel(images) {
        const slides = (images && images.length > 0)
            ? images
            : [{ label: 'Coming Soon', bg: 'linear-gradient(160deg, #141414, #1c1c1c)' }];

        const slidesHtml = slides.map(img => `
            <div class="carousel-slide"${img.bg ? ` style="background: ${img.bg};"` : ''}>
                ${img.src
                ? `<img src="${img.src}" alt="${img.label || ''}" loading="lazy">`
                : `<div class="slide-placeholder">
                           <i data-lucide="image"></i>
                           <span>${img.label || 'Coming Soon'}</span>
                       </div>`
            }
            </div>
        `).join('');

        const dotsHtml = slides.length > 1
            ? `<div class="carousel-dots">${slides.map((_, i) =>
                `<div class="carousel-dot${i === 0 ? ' active' : ''}"></div>`
            ).join('')}</div>`
            : '';

        const counterHtml = slides.length > 1
            ? `<div class="carousel-counter">1 / ${slides.length}</div>`
            : '';

        return `
            <div class="insta-image-container">
                ${counterHtml}
                <div class="carousel">${slidesHtml}</div>
                ${dotsHtml}
            </div>
        `;
    }

    // ─────────────────────────────────────────────────────────
    // Unified post template
    // ─────────────────────────────────────────────────────────
    function renderPost({ id, title, subtitle, avatarIcon, avatarBg, images, captionTitle, caption, tags, links }) {
        const isLiked = localStorage.getItem(`liked_${id}`) === 'true';
        const likeBtnClass = isLiked ? 'like-btn liked' : 'like-btn';

        const actionsHtml = `<div class="insta-actions">
            <button class="${likeBtnClass}" data-post-id="${id}" aria-label="Like Post">
                <i data-lucide="heart"></i>
            </button>
            ${links && links.length ? links.map(l =>
            `<a href="${l.href}" target="_blank" rel="noopener noreferrer" class="action-icon" aria-label="${l.label}">
                        <i data-lucide="${l.icon}"></i>
                    </a>`
        ).join('') : ''}
        </div>`;

        const tagsHtml = (tags && tags.length)
            ? `<div class="insta-tags">${tags.map(t => `<span>#${t}</span>`).join('')}</div>`
            : '';

        return `
            <article class="insta-post">
                <div class="insta-header">
                    <div class="insta-avatar"${avatarBg ? ` style="background: ${avatarBg};"` : ''}>
                        <i data-lucide="${avatarIcon || 'user'}"></i>
                    </div>
                    <div class="insta-header-text">
                        <span class="insta-title">${title}</span>
                        <span class="insta-subtitle">${subtitle}</span>
                    </div>
                </div>
                ${renderCarousel(images)}
                ${actionsHtml}
                <div class="insta-caption">
                    <span class="caption-title">${captionTitle || title}</span>
                    <span>${caption ? caption.trim() : ''}</span>
                </div>
                ${tagsHtml}
            </article>
        `;
    }

    // ─────────────────────────────────────────────────────────
    // Feed renderer — all three tabs use renderPost
    // ─────────────────────────────────────────────────────────
    function renderFeed(tabId, data) {
        const container = document.getElementById('feed-container');
        if (!container) return;

        let posts = [];

        if (tabId === 'projects') {
            posts = data.projects.map(p => renderPost({
                id: p.id,
                title: p.title,
                subtitle: 'Project',
                avatarIcon: 'code-2',
                avatarBg: '#0c1a0c',
                images: p.images,
                captionTitle: p.title,
                caption: ' ' + p.description,
                tags: p.techStack,
                links: [
                    ...(p.github ? [{ icon: 'github', href: p.github, label: 'GitHub' }] : []),
                    ...(p.liveLink ? [{ icon: 'external-link', href: p.liveLink, label: 'Live Demo' }] : [])
                ]
            }));

        } else if (tabId === 'experience') {
            posts = data.experience.map(e => renderPost({
                id: e.id,
                title: e.role,
                subtitle: `${e.company} · ${e.timeline}`,
                avatarIcon: 'briefcase',
                avatarBg: '#0c0c1e',
                images: e.images,
                captionTitle: e.company,
                caption: ' ' + e.bullets.join(' '),
                tags: e.skills,
                links: []
            }));

        } else if (tabId === 'education') {
            posts = data.education.map(ed => renderPost({
                id: ed.id,
                title: ed.school,
                subtitle: `${ed.degree} · ${ed.date}`,
                avatarIcon: 'graduation-cap',
                avatarBg: '#081818',
                images: ed.images,
                captionTitle: ed.degree,
                caption: ` ${ed.fullSchool || ed.school}. Coursework: ${ed.coursework.join(', ')}.`,
                tags: ed.coursework.slice(0, 4),
                links: []
            }));
        }

        container.innerHTML = posts.join('');
        lucide.createIcons({ root: container });

        // Sync carousel dots & counter on scroll
        container.querySelectorAll('.carousel').forEach(carousel => {
            const wrap = carousel.closest('.insta-image-container');
            if (!wrap) return;

            const counter = wrap.querySelector('.carousel-counter');
            const slidesCount = carousel.querySelectorAll('.carousel-slide').length;

            carousel.addEventListener('scroll', () => {
                const idx = Math.round(carousel.scrollLeft / carousel.offsetWidth);

                // Update dots
                wrap.querySelectorAll('.carousel-dot').forEach((dot, i) => {
                    dot.classList.toggle('active', i === idx);
                });

                // Update counter
                if (counter && slidesCount > 1) {
                    counter.textContent = `${idx + 1} / ${slidesCount}`;
                }
            }, { passive: true });
        });

        // Bind Like buttons
        container.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.getAttribute('data-post-id');
                btn.classList.toggle('liked');
                const isLiked = btn.classList.contains('liked');
                localStorage.setItem(`liked_${postId}`, isLiked.toString());
            });
        });
    }

    // ─────────────────────────────────────────────────────────
    // Highlight Modal
    // ─────────────────────────────────────────────────────────
    const highlightOverlay = document.getElementById('highlightOverlay');
    const highlightTitle = document.getElementById('highlightTitle');
    const highlightList = document.getElementById('highlightList');

    function openHighlightModal(data) {
        if (!highlightTitle || !highlightList || !highlightOverlay) return;
        highlightTitle.textContent = data.title;
        highlightList.innerHTML = data.skills.map(s =>
            `<li><strong>${s.name}</strong>: ${s.context}</li>`
        ).join('');
        highlightOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeHighlight() {
        if (!highlightOverlay) return;
        highlightOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    document.getElementById('highlightClose')?.addEventListener('click', closeHighlight);
    highlightOverlay?.addEventListener('click', e => { if (e.target === highlightOverlay) closeHighlight(); });

    // ─────────────────────────────────────────────────────────
    // Story Viewer
    // ─────────────────────────────────────────────────────────
    var storyOverlay = document.getElementById('storyOverlay');
    var storyCloseBtn = document.getElementById('storyClose');
    var storyPrev = document.getElementById('storyPrev');
    var storyNext = document.getElementById('storyNext');
    var slides = storyOverlay ? storyOverlay.querySelectorAll('.story-slide') : [];
    var fills = storyOverlay ? storyOverlay.querySelectorAll('.progress-fill') : [];
    var total = slides.length;
    var current = 0;
    var timer = null;
    var raf = null;
    var DURATION = 5000;
    var t0 = 0;

    function openStory(customSlides) {
        if (!storyOverlay) return;

        // Define default profile stories if an Event (click) or undefined is passed
        const isEvent = customSlides && customSlides.type;
        const storyData = (!customSlides || isEvent) ? [
            { label: 'UIUC Quad', bg: 'linear-gradient(160deg, #0a1a0f, #13294B)' },
            { label: 'Coding Setup', bg: 'linear-gradient(160deg, #0a0a1f, #1a0a2e)' },
            { label: 'Nature', bg: 'linear-gradient(160deg, #1f0a0a, #2e0a0a)' }
        ] : customSlides;

        // Generate DOM layout recursively
        const progressHtml = storyData.map(() => `<div class="progress-bar"><div class="progress-fill"></div></div>`).join('');
        const slidesHtml = storyData.map((s, i) => `
            <div class="story-slide${i === 0 ? ' active' : ''}" style="background: ${s.bg}">
                <span class="story-label">${s.label}</span>
                ${s.caption ? `<div class="story-caption" style="color: #ccc; margin-top: 10px; font-size: 0.9rem; max-width: 80%; text-align: center;">${s.caption}</div>` : ''}
            </div>
        `).join('');

        const progressContainer = storyOverlay.querySelector('.story-progress');
        const slidesContainer = storyOverlay.querySelector('.story-slides');

        if (progressContainer) progressContainer.innerHTML = progressHtml;
        if (slidesContainer) slidesContainer.innerHTML = slidesHtml;

        // Re-query dynamically created elements
        slides = storyOverlay.querySelectorAll('.story-slide');
        fills = storyOverlay.querySelectorAll('.progress-fill');
        total = slides.length;

        storyOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        goTo(0);
    }

    function closeStory() {
        if (!storyOverlay) return;
        storyOverlay.classList.remove('active');
        document.body.style.overflow = '';
        stop();
        fills.forEach(f => { f.style.width = '0%'; });
    }

    function goTo(n) {
        if (n >= total) { closeStory(); return; }
        if (n < 0) n = 0;
        current = n;
        slides.forEach(s => s.classList.remove('active'));
        slides[n].classList.add('active');
        fills.forEach((f, i) => {
            f.style.transition = 'none';
            f.style.width = i < n ? '100%' : '0%';
        });
        stop();
        t0 = Date.now();
        tick();
        timer = setTimeout(() => goTo(current + 1), DURATION);
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

    storyCloseBtn?.addEventListener('click', closeStory);
    storyPrev?.addEventListener('click', () => goTo(current - 1));
    storyNext?.addEventListener('click', () => goTo(current + 1));
    storyOverlay?.addEventListener('click', e => { if (e.target === storyOverlay) closeStory(); });

    // ─────────────────────────────────────────────────────────
    // Global keyboard
    // ─────────────────────────────────────────────────────────
    document.addEventListener('keydown', e => {
        if (highlightOverlay?.classList.contains('active')) {
            if (e.key === 'Escape') closeHighlight();
            return;
        }
        if (storyOverlay?.classList.contains('active')) {
            if (e.key === 'Escape') closeStory();
            if (e.key === 'ArrowLeft') goTo(current - 1);
            if (e.key === 'ArrowRight') goTo(current + 1);
        }
    });

    // ─────────────────────────────────────────────────────────
    // Smooth scroll for anchor links
    // ─────────────────────────────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const id = this.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

});
