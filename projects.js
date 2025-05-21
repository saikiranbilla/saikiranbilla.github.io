// Projects page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Filter projects by category
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectSections = document.querySelectorAll('.project-section');
    
    // Set up filter button functionality
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filterValue = this.getAttribute('data-filter');
            
            // Show/hide project sections based on filter
            if (filterValue === 'all') {
                projectSections.forEach(section => {
                    section.classList.remove('hidden');
                    setTimeout(() => {
                        section.style.opacity = 1;
                        section.style.transform = 'translateY(0)';
                    }, 50);
                });
            } else {
                projectSections.forEach(section => {
                    const sectionCategory = section.getAttribute('data-category');
                    
                    if (sectionCategory === filterValue) {
                        section.classList.remove('hidden');
                        setTimeout(() => {
                            section.style.opacity = 1;
                            section.style.transform = 'translateY(0)';
                        }, 50);
                    } else {
                        section.style.opacity = 0;
                        section.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            section.classList.add('hidden');
                        }, 500);
                    }
                });
            }
            
            // Scroll to top of projects when filter changes
            const projectsHeader = document.getElementById('projects-header');
            const headerOffset = projectsHeader.offsetTop + projectsHeader.offsetHeight - 100;
            window.scrollTo({
                top: headerOffset,
                behavior: 'smooth'
            });
        });
    });
    
    // Project card hover effects
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const projectImage = this.querySelector('.project-image img');
            if (projectImage) {
                projectImage.style.transform = 'scale(1.05)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const projectImage = this.querySelector('.project-image img');
            if (projectImage) {
                projectImage.style.transform = 'scale(1)';
            }
        });
    });
    
    // Apply theme to project cards based on role section
    function applyThemeColors() {
        const aiProjects = document.querySelectorAll('#ai-projects .project-tags span');
        const mlProjects = document.querySelectorAll('#ml-projects .project-tags span');
        const dataProjects = document.querySelectorAll('#data-projects .project-tags span');
        const biProjects = document.querySelectorAll('#bi-projects .project-tags span');
        
        aiProjects.forEach(tag => {
            tag.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
            tag.style.color = '#8B5CF6';
        });
        
        mlProjects.forEach(tag => {
            tag.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
            tag.style.color = '#10B981';
        });
        
        dataProjects.forEach(tag => {
            tag.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            tag.style.color = '#3B82F6';
        });
        
        biProjects.forEach(tag => {
            tag.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
            tag.style.color = '#F59E0B';
        });
    }
    
    // Apply theme colors on page load
    applyThemeColors();
    
    // Apply colors again when dark mode is toggled
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            setTimeout(applyThemeColors, 100);
        });
    }
    
    // Mobile adjustments
    function handleMobileLayout() {
        if (window.innerWidth <= 768) {
            const filterButtons = document.querySelectorAll('.filter-btn');
            filterButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    // If on mobile, close any open menu after clicking
                    const navLinks = document.querySelector('.nav-links');
                    if (navLinks && navLinks.classList.contains('active')) {
                        navLinks.classList.remove('active');
                        const icon = document.querySelector('.mobile-menu-toggle i');
                        if (icon) {
                            icon.classList.remove('fa-times');
                            icon.classList.add('fa-bars');
                        }
                    }
                });
            });
        }
    }
    
    // Handle mobile layout on load
    handleMobileLayout();
    
    // Update on window resize
    window.addEventListener('resize', handleMobileLayout);
}); 