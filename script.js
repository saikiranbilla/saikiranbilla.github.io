// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle functionality
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Toggle between light and dark theme
    themeToggle.addEventListener('click', function() {
        body.classList.toggle('dark-theme');
        
        if (body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });
    
    // Setup static description with a random selection
    function setupStaticDescription() {
        const typewriterElement = document.querySelector('.typewriter');
        
        // Multiple sentences for random selection
        const sentences = [
            "Data & Segmentation Analyst specializing in AI-driven solutions.",
            "Building data pipelines and visualizations with Python, SQL, and Tableau.",
            "Developing intuitive web experiences with React and AWS.",
            "Turning complex data into clear, actionable insights.",
            "Creating lightweight AI agents and LLM workflows.",
        ];
        
        // If we have a typewriter element, set a random sentence
        if (typewriterElement) {
            // Randomly select one of the sentences to display statically
            const randomSentenceIndex = Math.floor(Math.random() * sentences.length);
            typewriterElement.textContent = sentences[randomSentenceIndex];
        }
    }
    
    // Run the setup function for static description
    setupStaticDescription();
    
    // Tech Phrase Typing Effect
    const techPhraseElement = document.querySelector('.tech-phrase');
    const techPhrases = [
        "Building with data",
        "Exploring AI agents",
        "Designing NLP models",
        "Visualizing analytics",
        "Developing LLM workflows",
        "Engineering data solutions"
    ];
    
    let techPhraseIndex = 0;
    let techCharIndex = 0;
    let techIsDeleting = false;
    
    function techPhraseTyping() {
        if (!techPhraseElement) return;
        
        const currentPhrase = techPhrases[techPhraseIndex];
        
        // If typing
        if (!techIsDeleting) {
            techPhraseElement.textContent = currentPhrase.substring(0, techCharIndex + 1);
            techCharIndex++;
            
            // If phrase is complete
            if (techCharIndex === currentPhrase.length) {
                // Pause before deleting
                techIsDeleting = true;
                setTimeout(techPhraseTyping, 1500);
                return;
            }
        } 
        // If deleting
        else {
            techPhraseElement.textContent = currentPhrase.substring(0, techCharIndex);
            techCharIndex--;
            
            // If deletion is complete
            if (techCharIndex === 0) {
                techIsDeleting = false;
                // Move to next phrase
                techPhraseIndex = (techPhraseIndex + 1) % techPhrases.length;
                setTimeout(techPhraseTyping, 500);
                return;
            }
        }
        
        // Schedule next iteration with variable speed
        const speed = techIsDeleting ? 30 : 70;
        setTimeout(techPhraseTyping, speed + Math.random() * 40);
    }
    
    // Start the tech phrase typing effect
    setTimeout(techPhraseTyping, 900);
    
    // Enhanced animation interactions
    function setupAnimationInteractions() {
        const heroSection = document.getElementById('hero');
        if (!heroSection) return;
        
        // Add parallax effect to data wave on scroll
        window.addEventListener('scroll', function() {
            const scrollY = window.scrollY;
            const dataWave = document.querySelector('.data-wave');
            
            if (dataWave && scrollY < heroSection.offsetHeight) {
                dataWave.style.transform = `translateY(${-50 + scrollY * 0.05}%)`;
            }
        });
        
        // Create reactive data nodes
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.addEventListener('mousemove', function(e) {
                const dataNodes = document.querySelectorAll('.data-node');
                const mouseX = e.clientX / window.innerWidth;
                const mouseY = e.clientY / window.innerHeight;
                
                dataNodes.forEach((node, index) => {
                    // Skip if user prefers reduced motion
                    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
                    
                    // Small subtle movement based on mouse position
                    const offsetX = (mouseX - 0.5) * 15 * (index % 3 + 1);
                    const offsetY = (mouseY - 0.5) * 15 * (index % 2 + 1);
                    
                    node.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${node.classList.contains('active') ? 1 : 0.8})`;
                });
            });
        }
        
        // Create dynamic data connections
        document.querySelectorAll('.highlight, .btn, .social-links a').forEach(element => {
            element.addEventListener('mouseenter', function() {
                // Add a class to the closest data node to show connection
                const randomNode = document.querySelector(`.data-node-${Math.floor(Math.random() * 5) + 1}`);
                if (randomNode) {
                    randomNode.classList.add('active');
                    randomNode.style.transform = 'scale(1.2)';
                    randomNode.style.opacity = '0.8';
                }
            });
            
            element.addEventListener('mouseleave', function() {
                // Remove active class from all nodes
                document.querySelectorAll('.data-node').forEach(node => {
                    node.classList.remove('active');
                    node.style.transform = 'scale(0.8)';
                    node.style.opacity = '0.5';
                });
            });
        });
    }
    
    // Setup animation interactions after page load
    setTimeout(setupAnimationInteractions, 800);
    
    // Create additional circuit and data nodes dynamically
    function createDataElements() {
        const heroSection = document.getElementById('hero');
        const animationsContainer = document.querySelector('.hero-animations');
        
        if (!heroSection || !animationsContainer) return;
        
        // Create additional data phrases floating in background
        const dataPhrases = ['AI', 'SQL', 'Python', 'Tableau', 'LLM', 'DataFrame', 'ETL', 'Segmentation', 'Embeddings', 'Analytics', 'Regression', 'NLP', 'Clusters', 'Neural Nets', 'AWS'];
        
        dataPhrases.forEach((phrase, index) => {
            const dataPhrase = document.createElement('div');
            dataPhrase.className = 'code-line';
            dataPhrase.textContent = phrase;
            dataPhrase.style.top = `${Math.random() * 90}%`;
            dataPhrase.style.right = `${Math.random() * 40 + 40}%`; // More central positioning
            dataPhrase.style.animationDelay = `${Math.random() * 10}s`;
            dataPhrase.style.opacity = '0.05';
            dataPhrase.style.fontSize = `${Math.random() * 0.6 + 0.8}rem`; // Varied sizes
            
            animationsContainer.appendChild(dataPhrase);
        });
    }
    
    // Generate circuit elements after page load
    setTimeout(createDataElements, 500);
    
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            
            // Change icon based on menu state
            const icon = mobileMenuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Close mobile menu when a link is clicked
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', function() {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    
                    const icon = mobileMenuToggle.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }
    
    // Resume tabs functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    function activateTab(tabId) {
        // Remove active class from all buttons and content
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => {
            c.classList.remove('active');
            // Add a small delay before hiding to allow animation to complete
            setTimeout(() => {
                if (!c.classList.contains('active')) {
                    c.style.display = 'none';
                }
            }, 300);
        });
        
        // Add active class to the relevant button
        const targetBtn = document.querySelector(`.tab-btn[data-target="${tabId}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
        
        // Show corresponding tab content
        const targetContent = document.getElementById(tabId);
        if (targetContent) {
            targetContent.style.display = 'block';
            
            // Small delay to trigger animation
            setTimeout(() => {
                targetContent.classList.add('active');
            }, 10);
        }
    }
    
    if (tabBtns.length > 0) {
        // Initialize tab content visibility
        document.getElementById('education').classList.add('active');
        
        // Add click handlers to tab buttons
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                activateTab(targetId);
                
                // Update URL hash without scrolling
                const newUrl = `#resume-${targetId}`;
                history.pushState(null, '', newUrl);
            });
        });
        
        // Handle direct navigation to resume section with specific tab
        const handleResumeNavigation = () => {
            if (window.location.hash && window.location.hash.includes('resume-')) {
                const tabId = window.location.hash.replace('#resume-', '');
                activateTab(tabId);
                
                // Ensure proper scrolling to the section
                const resumeSection = document.getElementById('resume');
                if (resumeSection) {
                    window.scrollTo({
                        top: resumeSection.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        };
        
        // Execute on page load and hash change
        window.addEventListener('load', handleResumeNavigation);
        window.addEventListener('hashchange', handleResumeNavigation);
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Adjusted for header height
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Highlight active navigation link based on scroll position
    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-links a');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveNavLink);
    
    // Form validation and submission
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');
            
            // Simple validation
            let isValid = true;
            
            if (nameInput.value.trim() === '') {
                showError(nameInput, 'Name is required');
                isValid = false;
            } else {
                removeError(nameInput);
            }
            
            if (emailInput.value.trim() === '') {
                showError(emailInput, 'Email is required');
                isValid = false;
            } else if (!isValidEmail(emailInput.value)) {
                showError(emailInput, 'Please enter a valid email');
                isValid = false;
            } else {
                removeError(emailInput);
            }
            
            if (messageInput.value.trim() === '') {
                showError(messageInput, 'Message is required');
                isValid = false;
            } else {
                removeError(messageInput);
            }
            
            if (isValid) {
                // Simulate form submission
                const submitBtn = contactForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';
                
                // Simulate API call
                setTimeout(() => {
                    contactForm.reset();
                    submitBtn.textContent = 'Message Sent!';
                    
                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }, 2000);
                }, 1500);
            }
        });
    }
    
    // Helper functions for form validation
    function showError(input, message) {
        const formGroup = input.parentElement;
        const errorElement = formGroup.querySelector('.error-message') || document.createElement('div');
        
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        if (!formGroup.querySelector('.error-message')) {
            formGroup.appendChild(errorElement);
        }
        
        input.classList.add('error');
    }
    
    function removeError(input) {
        const formGroup = input.parentElement;
        const errorElement = formGroup.querySelector('.error-message');
        
        if (errorElement) {
            formGroup.removeChild(errorElement);
        }
        
        input.classList.remove('error');
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Animated skill bar (optional)
    function animateSkills() {
        const skillList = document.querySelectorAll('.skill-list li');
        
        skillList.forEach((skill, index) => {
            skill.style.animation = `fadeInUp 0.5s ease forwards ${index * 0.1}s`;
            skill.style.opacity = '0';
        });
    }
    
    // Initialize animations
    animateSkills();
    
    // Navbar scroll behavior
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Update href for project buttons
    const projectButtons = document.querySelectorAll('a[href="#projects"]');
    projectButtons.forEach(button => {
        button.setAttribute('href', 'projects.html');
    });
}); 