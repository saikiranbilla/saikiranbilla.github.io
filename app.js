document.addEventListener('DOMContentLoaded', () => {
    // Always enforce dark mode on load, as requested
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.removeItem('theme'); // Reset any stray saved preference

    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            if (window._threeShapes) {
                window._threeShapes.setTheme(newTheme === 'light');
            }
        });
    }

    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            renderMeta(data.meta);
            renderAbout(data.meta.about);
            renderProjects(data.projects);
            renderExperience(data.experience);
            renderEducation(data.education);
            renderJournal(data.journal);
            renderContact(data.meta.contact, data.meta.social);

            // Apply reveal classes AFTER rendering
            document.querySelectorAll('.project-card, .journal-entry, .about__content p').forEach(el => {
                el.classList.add('reveal');
            });
            // Apply staggering
            document.querySelectorAll('.projects__list, .experience__list, .education__list, .journal__list, .about__content').forEach(parent => {
                const reveals = parent.querySelectorAll('.reveal');
                reveals.forEach((el, idx) => {
                    const maxDelay = window.innerWidth <= 768 ? 0.15 : 2; // cap staggering to max seconds
                    el.style.transitionDelay = Math.min((idx * 0.08), maxDelay) + 's';
                });
            });

            bindObservers();
            initScrollReveals();
            initCardTilt();
            findAndWrapNumbers();
            initMagneticNav();
            initScrollOpacity();
        })
        .catch(err => {
            console.error(err);
            const main = document.querySelector('main');
            if (main) {
                main.innerHTML = '<div style="text-align: center; margin-top: 50vh;">Portfolio loading — check back soon.</div>';
            }
        });

    function splitName() {
        const nameEl = document.querySelector('.name');
        if (!nameEl) return;
        const text = nameEl.innerText;
        nameEl.innerHTML = '';

        [...text].forEach((char, index) => {
            if (char === ' ') {
                const space = document.createElement('span');
                space.style.display = 'inline-block';
                space.style.width = '0.3em';
                nameEl.appendChild(space);
            } else {
                const span = document.createElement('span');
                span.className = 'char';
                span.innerText = char;
                span.style.animationDelay = (0.3 + index * 0.04) + 's';
                nameEl.appendChild(span);
            }
        });
    }

    function renderMeta(meta) {
        const nameEl = document.querySelector('.name');
        if (nameEl) {
            nameEl.innerText = meta.name;
            splitName();
        }

        const titleEl = document.querySelector('.title');
        if (titleEl) titleEl.innerText = meta.title;

        const taglineEl = document.querySelector('.tagline');
        if (taglineEl) {
            const lines = meta.tagline.split('\n');
            const group = document.createElement('div');
            group.className = 'tagline-group';

            const devanagari = document.createElement('p');
            devanagari.className = 'tagline-devanagari';
            devanagari.textContent = lines[0];

            const transliteration = document.createElement('p');
            transliteration.className = 'tagline-transliteration';
            transliteration.textContent = lines[1] || '';

            group.appendChild(devanagari);
            group.appendChild(transliteration);

            taglineEl.replaceWith(group);
        }

        const statusEl = document.querySelector('.status__text');
        if (statusEl) statusEl.innerText = meta.status.text;

        const gh = document.getElementById('social-github');
        if (gh) gh.href = meta.social.github;
        const li = document.getElementById('social-linkedin');
        if (li) li.href = meta.social.linkedin;
        const em = document.getElementById('social-email');
        if (em) em.href = "mailto:" + meta.social.email;
    }

    function renderAbout(about) {
        const container = document.querySelector('.about__content');
        if (!container) return;

        const p = document.createElement('p');
        p.className = 'reveal';
        p.innerText = about;
        container.appendChild(p);
    }

    function renderProjects(projects) {
        const container = document.querySelector('.projects__list');
        if (!container) return;

        projects.sort((a, b) => {
            if (a.type === 'hero') return -1;
            if (b.type === 'hero') return 1;
            return 0;
        });

        projects.forEach(p => {
            if (p.type === 'hero') {
                const card = document.createElement('div');
                card.className = 'project-card hero';
                card.setAttribute('data-tilt', '');

                let pipelineHtml = '';
                if (p.aiMeta && p.aiMeta.pipeline) {
                    const stages = p.aiMeta.pipeline.split('→').map(s => s.trim()).filter(Boolean);
                    pipelineHtml = '<div class="pipeline-badge">';
                    stages.forEach((s, idx) => {
                        pipelineHtml += `<span class="pipeline-stage active">${s}</span>`;
                        if (idx < stages.length - 1) {
                            pipelineHtml += `<span class="pipeline-arrow">→</span>`;
                        }
                    });
                    pipelineHtml += '</div>';
                }

                let linksHtml = '<div class="project-links">';
                if (p.links && p.links.demo) linksHtml += `<a href="${p.links.demo}" class="project-link" target="_blank" rel="noopener">View Demo &rarr;</a>`;
                if (p.links && p.links.code) linksHtml += `<a href="${p.links.code}" class="project-link" target="_blank" rel="noopener">View Code &rarr;</a>`;
                if (p.links && p.links.writeup) linksHtml += `<a href="${p.links.writeup}" class="project-link" target="_blank" rel="noopener">Writeup &rarr;</a>`;
                linksHtml += '</div>';

                let playgroundHtml = '';
                if (p.aiMeta && p.aiMeta.hasPlayground) {
                    playgroundHtml = `<a class="playground-btn" href="${p.aiMeta.playgroundUrl}" target="_blank" rel="noopener">Try the Model &rarr;</a>`;
                }

                let techHtml = '<div class="tech-row">';
                (p.tech || []).forEach(t => techHtml += `<span class="tech-tag">${t}</span>`);
                techHtml += '</div>';

                card.innerHTML = `
                    <div class="project__tilt-shine"></div>
                    <h3 class="project-card__title">${p.title}</h3>
                    <p class="project-card__impact">${p.impact}</p>
                    <div class="case-study">
                        <div class="case-study__block"><span class="case-study__label">Problem</span><span class="case-study__body">${p.problem}</span></div>
                        <div class="case-study__block"><span class="case-study__label">Approach</span><span class="case-study__body">${p.approach}</span></div>
                        <div class="case-study__block"><span class="case-study__label">Impact</span><span class="case-study__body">${p.impact}</span></div>
                        <div class="case-study__block"><span class="case-study__label">Reflection</span><span class="case-study__body">${p.reflection}</span></div>
                    </div>
                    ${techHtml}
                    ${pipelineHtml}
                    ${linksHtml}
                    ${playgroundHtml}
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

                container.appendChild(card);
            } else {
                const card = document.createElement('article');
                card.className = 'project-card standard';
                card.setAttribute('data-tilt', '');
                card.setAttribute('tabindex', '0');
                card.setAttribute('aria-expanded', 'false');

                let linksHtml = '<div class="project-links">';
                if (p.links && p.links.demo) linksHtml += `<a href="${p.links.demo}" class="project-link" target="_blank" rel="noopener">View Demo &rarr;</a>`;
                if (p.links && p.links.code) linksHtml += `<a href="${p.links.code}" class="project-link" target="_blank" rel="noopener">View Code &rarr;</a>`;
                if (p.links && p.links.writeup) linksHtml += `<a href="${p.links.writeup}" class="project-link" target="_blank" rel="noopener">Writeup &rarr;</a>`;
                linksHtml += '</div>';

                let playgroundHtml = '';
                if (p.aiMeta && p.aiMeta.hasPlayground) {
                    playgroundHtml = `<a class="playground-btn" href="${p.aiMeta.playgroundUrl}" target="_blank" rel="noopener">Try the Model &rarr;</a>`;
                }

                let techHtml = '<div class="tech-row">';
                (p.tech || []).forEach(t => techHtml += `<span class="tech-tag">${t}</span>`);
                techHtml += '</div>';

                card.innerHTML = `
                    <div class="project__tilt-shine"></div>
                    <div class="project-card__header">
                        <h3 class="project-card__title">${p.title}</h3>
                        <span class="project-card__chevron">▾</span>
                    </div>
                    <p class="project-card__impact">${p.impact}</p>
                    ${techHtml}
                    ${linksHtml}
                    <div class="project-card__expand">
                        <div class="case-study" style="margin-top: 16px;">
                            <div class="case-study__block"><span class="case-study__label">Problem</span><span class="case-study__body">${p.problem}</span></div>
                            <div class="case-study__block"><span class="case-study__label">Approach</span><span class="case-study__body">${p.approach}</span></div>
                            <div class="case-study__block"><span class="case-study__label">Reflection</span><span class="case-study__body">${p.reflection}</span></div>
                        </div>
                        ${playgroundHtml}
                    </div>
                `;

                const toggleExpand = () => {
                    const expanded = card.getAttribute('aria-expanded') === 'true';
                    card.setAttribute('aria-expanded', !expanded);
                };
                card.addEventListener('click', toggleExpand);
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

                container.appendChild(card);
            }
        });

        if (window.innerWidth <= 768) {
            const heroCard = document.querySelector('.project-card.hero');
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
            (j.tags || []).forEach(t => tagsHtml += `<span class="journal-tag">${t}</span>`);
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
                <div class="journal-entry__meta"><span class="journal-entry__date">${dateStr}</span></div>
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

            let techHtml = '<div class="tech-row">';
            (e.tech || []).forEach(t => techHtml += `<span class="tech-tag">${t}</span>`);
            techHtml += '</div>';

            article.innerHTML = `
                <p class="exp-card__period">${e.period}</p>
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
                <p class="edu-card__school">${e.school} <span class="edu-card__year">(${e.year})</span></p>
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

    // Smooth scrolling
    const mainEl = document.querySelector('main') || document.documentElement;

    function smoothScrollTo(targetY, duration = 600) {
        const startY = mainEl.scrollTop;
        const distance = targetY - startY;
        const startTime = performance.now();

        const easeInOutCubic = t =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            mainEl.scrollTo(0, startY + distance * easeInOutCubic(progress));
            if (progress < 1) requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                const targetY = target.offsetTop - 32;
                smoothScrollTo(targetY, 650);
            }
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
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const sections = document.querySelectorAll('section[id]');
        const isMobile = window.innerWidth <= 768;

        const onScroll = () => {
            sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                const windowHeight = window.innerHeight;

                // Skip any section that is taller than window.innerHeight * 1.5
                if (rect.height > windowHeight * 1.5) {
                    section.style.opacity = 1;
                    return;
                }

                // How centered is this section in the viewport (0 = edge, 1 = centered)
                const center = windowHeight / 2;
                const sectionCenter = rect.top + rect.height / 2;
                const distance = Math.abs(center - sectionCenter);
                const maxDistance = windowHeight * 0.75;

                if (isMobile) {
                    section.style.opacity = 1;
                    section.style.transition = 'none';
                    return;
                }

                const opacity = Math.max(0.6, 1 - (distance / maxDistance) * 0.4);

                section.style.opacity = opacity;
                section.style.transition = 'opacity 0.15s ease';
            });
        };

        if (mainEl) {
            mainEl.addEventListener('scroll', onScroll, { passive: true });
        } else {
            window.addEventListener('scroll', onScroll, { passive: true });
        }
        onScroll();
    }

    function initScrollReveals() {
        const isMobile = window.innerWidth <= 768;
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    const sectionLabel = entry.target.closest('section')?.querySelector('.section__label');
                    if (sectionLabel) sectionLabel.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: mainEl && window.innerWidth > 768 ? mainEl : null,
            rootMargin: isMobile ? '-20px' : '-60px',
            threshold: 0.1
        });

        document.querySelectorAll('.reveal').forEach(el => {
            if (isMobile) {
                // Reduce movement aggressively
                if (el.classList.contains('from-left')) {
                    el.style.transform = 'translateX(-8px)';
                } else if (!el.classList.contains('scale-in')) {
                    el.style.transform = 'translateY(8px)';
                }
            }
            observer.observe(el);
        });

        // Custom observer just for headers acting quicker on touch
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

    function bindObservers() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        const observerOptions = {
            root: mainEl && window.innerWidth > 768 ? mainEl : null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');

                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
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

                card.style.transform = `perspective(800px) rotateX(${offsetY * -3}deg) rotateY(${offsetX * 3}deg) scale(1.01)`;
                const posX = (x / rect.width) * 100;
                const posY = (y / rect.height) * 100;
                shine.style.background = `radial-gradient(circle at ${posX}% ${posY}%, rgba(200,149,108,0.08), transparent 60%)`;
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

    // Scroll progress loop
    const scrollProgress = document.querySelector('.scroll-progress');
    const scrollTarget = window.innerWidth > 768 ? (document.querySelector('main') || window) : window;
    
    scrollTarget.addEventListener('scroll', () => {
        const scroller = scrollTarget === window ? document.documentElement : scrollTarget;
        const totalScroll = scroller.scrollTop;
        const windowHeight = scroller.scrollHeight - scroller.clientHeight;
        const scroll = `${(totalScroll / windowHeight) * 100}%`;
        if (scrollProgress) {
            scrollProgress.style.width = scroll;
        }
    }, { passive: true });

    // Single RAF loop for spotlight interpolation
    const spotlight = document.querySelector('.spotlight');
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;
    let targetX = currentX;
    let targetY = currentY;
    let animationFrameId;

    if (spotlight && window.innerWidth > 768 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        let isFirstMove = true;

        document.addEventListener('mousemove', e => {
            if (isFirstMove) {
                console.log("first mousemove fired");
                isFirstMove = false;
            }
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

        console.log("spotlight initialized");
        animationFrameId = requestAnimationFrame(loop);
    }

    function initMagneticNav() {
        if (window.innerWidth <= 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const navLinks = document.querySelectorAll('.nav-link');
        const sidebar = document.querySelector('.sidebar');

        if (!sidebar) return;

        sidebar.addEventListener('mousemove', e => {
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
