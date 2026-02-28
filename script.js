// Initialize Lucide icons if not already done in HTML
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
    // --- LOAD DYNAMIC CONTENT ---
    loadSiteContent();
    loadSkills();
    loadProjects();

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const burger = document.querySelector('.burger');
    const navLinks = document.querySelector('.nav-links');

    if (burger) {
        burger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Close mobile menu when a link is clicked
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
        });
    });

    // Update active link on scroll
    const sections = document.querySelectorAll('section');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        links.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // Form submission handle
    const form = document.querySelector('.contact-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.textContent;

            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');

            btn.textContent = 'Sending...';
            btn.style.opacity = '0.8';
            btn.disabled = true;

            try {
                // Send data to the backend
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: nameInput.value,
                        email: emailInput.value,
                        message: messageInput.value
                    })
                });

                const contentType = response.headers.get('content-type');
                let data;

                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    const errorText = await response.text();
                    console.error('Server error response:', errorText);
                    throw new Error('Server returned non-JSON response. Check console for details.');
                }

                if (response.ok) {
                    btn.textContent = 'Message Sent!';
                    btn.style.backgroundColor = '#10b981'; // Green success color
                    form.reset();
                } else {
                    throw new Error(data.error || 'Failed to send message');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                btn.textContent = 'Error!';
                btn.style.backgroundColor = '#ef4444'; // Red error color
                alert(error.message || 'There was a problem sending your message.');
            } finally {

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.backgroundColor = '';
                    btn.style.opacity = '1';
                    btn.disabled = false;
                }, 3000);
            }
        });
    }

    // --- DYNAMIC CONTENT FUNCTIONS ---

    async function loadSiteContent() {
        try {
            const res = await fetch('/api/content');
            const data = await res.json();

            // Map keys to elements manually or by adding data-content-key attributes to HTML
            const mappings = {
                'hero_greeting': document.querySelector('#home h1'),
                'hero_role': document.querySelector('#home h2'),
                'hero_description': document.querySelector('#home p'),
                'about_p1': document.querySelector('#about .about-text p:first-of-type'),
                'about_p2': document.querySelector('#about .about-text p:nth-of-type(2)')
            };

            // Special handling for hero name containing the highlight span
            if (mappings['hero_greeting'] && data.hero_greeting && data.hero_name) {
                mappings['hero_greeting'].innerHTML = `${data.hero_greeting} <span class="highlight">${data.hero_name}</span>`;
            }
            if (mappings['hero_role'] && data.hero_role) mappings['hero_role'].textContent = data.hero_role;
            if (mappings['hero_description'] && data.hero_description) mappings['hero_description'].textContent = data.hero_description;
            if (mappings['about_p1'] && data.about_p1) mappings['about_p1'].textContent = data.about_p1;
            if (mappings['about_p2'] && data.about_p2) mappings['about_p2'].textContent = data.about_p2;

        } catch (err) {
            console.error('Failed to load site content', err);
        }
    }

    async function loadSkills() {
        try {
            const res = await fetch('/api/skills');
            const skills = await res.json();

            const skillsContainer = document.querySelector('.skills');
            if (skillsContainer && skills.length > 0) {
                skillsContainer.innerHTML = '';
                skills.forEach(skill => {
                    const span = document.createElement('span');
                    span.className = 'skill-tag';
                    span.textContent = skill.name;
                    skillsContainer.appendChild(span);
                });
            }
        } catch (err) {
            console.error('Failed to load skills', err);
        }
    }

    async function loadProjects() {
        try {
            const res = await fetch('/api/projects');
            const projects = await res.json();

            // Use the specific container you added if valid
            let projectGrid = document.querySelector('.project-grid');
            let standaloneWrapper = false;

            // Fix for current HTML layout having children directly under section instead of wrapper
            if (!projectGrid) {
                const projectsSection = document.getElementById('projects');
                const title = projectsSection.querySelector('.section-title');

                // create the wrapper properly
                projectGrid = document.createElement('div');
                projectGrid.className = 'project-grid';
                projectsSection.appendChild(projectGrid);
                standaloneWrapper = true;
            }

            if (projects.length > 0) {
                if (projectGrid) projectGrid.innerHTML = '';

                // Only if we just created the wrapper, clean out the old hardcoded HTML
                if (standaloneWrapper) {
                    const cards = document.querySelectorAll('#projects .project-card, #projects .project-info');
                    cards.forEach(c => {
                        if (c.parentNode.id === 'projects') c.remove();
                    });
                }

                // Add new ones
                projects.forEach(p => {
                    const div = document.createElement('div');
                    div.className = 'project-card';

                    let imageHTML = `<div class="project-image" style="background: linear-gradient(135deg, #e0e7ff, #ffffff);">`;
                    if (p.image_url) {
                        imageHTML += `<img src="${p.image_url}" alt="${p.title}" class="profile-photo">`;
                    }
                    imageHTML += `</div>`;

                    let linksHTML = '';
                    if (p.code_url) {
                        linksHTML += `<a href="${p.code_url}" target="_blank" class="link"><i data-lucide="github"></i> Code</a>`;
                    }
                    if (p.live_url) {
                        linksHTML += `<a href="${p.live_url}" target="_blank" class="link"><i data-lucide="external-link"></i> Live</a>`;
                    }

                    div.innerHTML = `
                        ${imageHTML}
                        <div class="project-info">
                            <h3>${p.title}</h3>
                            <p>${p.description}</p>
                            <div class="project-links">${linksHTML}</div>
                        </div>
                    `;
                    projectGrid.appendChild(div);
                });

                // Re-initialize any new icons
                lucide.createIcons();
            }
        } catch (err) {
            console.error('Failed to load projects', err);
        }
    }
});
