// Create floating particles
const particlesContainer = document.getElementById('particles');
if (particlesContainer) {
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Mobile menu toggle
function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// Scroll reveal
const reveals = document.querySelectorAll('.card, .project-card, .sandwich-card, .stat-box');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

reveals.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease';
    revealObserver.observe(el);
});

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const navLinks = document.getElementById('navLinks');
            if (navLinks) {
                navLinks.classList.remove('active');
            }
        }
    });
});

// Gallery filter functionality
const filterButtons = document.querySelectorAll('.gallery-filter');
const galleryItems = document.querySelectorAll('.gallery-item');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const filter = button.dataset.filter;

        galleryItems.forEach(item => {
            if (filter === 'all' || item.dataset.category === filter) {
                item.style.display = 'block';
                item.style.opacity = '1';
            } else {
                item.style.opacity = '0';
                setTimeout(() => {
                    if (!item.dataset.category.includes(filter) && filter !== 'all') {
                        item.style.display = 'none';
                    }
                }, 300);
            }
        });
    });
});

// Netlify Identity
if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", user => {
        if (!user) {
            window.netlifyIdentity.on("login", () => {
                document.location.href = "/admin/";
            });
        }
    });
}

// Dynamic Grow Journal Loader
async function loadGrowJournal() {
    const GITHUB_REPO = 'jacksonbull87/personal-website-';
    const POSTS_PATH = '_posts/grow-journal';
    const galleryContainer = document.getElementById('grow-gallery');
    const timelineContainer = document.getElementById('grow-timeline');
    
    if (!galleryContainer || !timelineContainer) return;

    try {
        // 1. Fetch file list from GitHub
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${POSTS_PATH}`);
        if (!response.ok) throw new Error('Failed to fetch posts list');
        const files = await response.json();

        // 2. Fetch and parse each post
        const posts = await Promise.all(files.filter(f => f.name.endsWith('.md')).map(async (file) => {
            const res = await fetch(file.download_url);
            const content = await res.text();
            
            // Simple Frontmatter Parser
            const frontmatterMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
            if (!frontmatterMatch) return null;
            
            const data = {};
            frontmatterMatch[1].split('\n').forEach(line => {
                const [key, ...val] = line.split(':');
                if (key && val) data[key.trim()] = val.join(':').trim();
            });

            return {
                ...data,
                body: content.replace(frontmatterMatch[0], '').trim(),
                day: parseInt(data.day || 0),
                cycle: parseFloat(data.cycle || 0)
            };
        }));

        const validPosts = posts.filter(p => p !== null).sort((a, b) => b.day - a.day);
        if (validPosts.length === 0) return;

        // 3. Update Stats with Latest Post
        const latest = validPosts[0];
        document.getElementById('stat-cycle').textContent = `V${latest.cycle.toFixed(1)}`;
        document.getElementById('stat-days').textContent = latest.day;
        document.getElementById('stat-height').textContent = latest.height ? `${latest.height}"` : '--';
        document.getElementById('stat-stage').textContent = latest.stage || '--';
        document.getElementById('grow-subtitle').textContent = `Controlled environment cultivation — currently growing ${latest.strain} (V${latest.cycle.toFixed(1)}).`;
        document.getElementById('grow-current-title').textContent = `CURRENT GROW: ${latest.strain.toUpperCase()}`;

        // 4. Update Gallery
        galleryContainer.innerHTML = '';
        validPosts.forEach((post, index) => {
            if (!post.thumbnail) return;
            const item = document.createElement('div');
            item.className = `grow-gallery-item ${index === 0 ? 'featured' : ''}`;
            item.innerHTML = `
                <img src="${post.thumbnail}" alt="Day ${post.day} - ${post.title}" loading="lazy">
                <div class="grow-gallery-caption">
                    <span class="caption-day">Day ${post.day}</span>
                    <span class="caption-text">${post.title}</span>
                </div>
            `;
            galleryContainer.appendChild(item);
        });

        // 5. Update Timeline (Simplified for now)
        // We could group by phase, but for now we'll just show the latest milestones
        timelineContainer.innerHTML = '';
        const phases = [...new Set(validPosts.map(p => p.stage))];
        phases.forEach(phase => {
            const phasePosts = validPosts.filter(p => p.stage === phase);
            const phaseDiv = document.createElement('div');
            phaseDiv.className = 'grow-phase active';
            phaseDiv.innerHTML = `
                <div class="grow-phase-header">
                    <div class="grow-phase-marker"></div>
                    <h4>${phase}</h4>
                </div>
                <div class="grow-phase-content">
                    ${phasePosts.map(p => `
                        <div class="grow-milestone ${p === latest ? 'current' : ''}">
                            <span class="milestone-day">Day ${p.day}</span>
                            <p>${p.body.substring(0, 150)}${p.body.length > 150 ? '...' : ''}</p>
                        </div>
                    `).join('')}
                </div>
            `;
            timelineContainer.appendChild(phaseDiv);
        });

    } catch (error) {
        console.error('Error loading grow journal:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadGrowJournal();
});
