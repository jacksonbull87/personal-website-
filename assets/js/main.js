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
        // 1. Fetch file list from GitHub (with cache busting)
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${POSTS_PATH}?ref=main&t=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch posts list');
        const files = await response.json();

        // 2. Fetch and parse each post
        const posts = await Promise.all(files.filter(f => f.name.endsWith('.md')).map(async (file) => {
            const res = await fetch(`${file.download_url}?t=${Date.now()}`);
            const content = await res.text();
            
            // Simple Frontmatter Parser (Case-insensitive & more robust)
            const frontmatterMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
            if (!frontmatterMatch) return null;
            
            const data = {};
            frontmatterMatch[1].split('\n').forEach(line => {
                const sepIdx = line.indexOf(':');
                if (sepIdx !== -1) {
                    const key = line.substring(0, sepIdx).trim().toLowerCase();
                    const val = line.substring(sepIdx + 1).trim();
                    data[key] = val;
                }
            });

            return {
                ...data,
                body: content.replace(frontmatterMatch[0], '').trim(),
                day: parseInt(data.day || 0),
                cycle: parseFloat(data.cycle || 0),
                title: data.title || 'Untitled Update',
                thumbnail: data.thumbnail || null,
                strain: data.strain || 'Unknown Strain',
                stage: data.stage || 'In Progress'
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
            
            let finalImgSrc = post.thumbnail.trim();

            // If it's a relative path (starts with /images or images), use GitHub Raw
            if (!finalImgSrc.startsWith('http')) {
                let imgPath = finalImgSrc;
                if (imgPath.startsWith('/')) imgPath = imgPath.substring(1);
                finalImgSrc = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${imgPath}`;
            }

            const item = document.createElement('div');
            item.className = `grow-gallery-item ${index === 0 ? 'featured' : ''}`;
            item.innerHTML = `
                <img src="${finalImgSrc}" alt="Day ${post.day} - ${post.title}" loading="lazy">
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

// Dynamic Sandwich Loader
async function loadSandwiches() {
    const GITHUB_REPO = 'jacksonbull87/personal-website-';
    const POSTS_PATH = '_posts/sandwiches';
    const sandwichContainer = document.getElementById('sandwich-list');
    
    if (!sandwichContainer) return;

    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${POSTS_PATH}?ref=main&t=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch sandwiches list');
        const files = await response.json();

        const sandwiches = await Promise.all(files.filter(f => f.name.endsWith('.md')).map(async (file) => {
            const res = await fetch(`${file.download_url}?t=${Date.now()}`);
            const content = await res.text();
            
            const frontmatterMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
            if (!frontmatterMatch) return null;
            
            const data = {};
            frontmatterMatch[1].split('\n').forEach(line => {
                const sepIdx = line.indexOf(':');
                if (sepIdx !== -1) {
                    const key = line.substring(0, sepIdx).trim().toLowerCase();
                    const val = line.substring(sepIdx + 1).trim();
                    data[key] = val;
                }
            });

            return {
                ...data,
                rank: parseInt(data.rank || 99),
                rating: data.rating || 'N/A',
                title: data.title || 'Untitled Sandwich',
                description: data.description || ''
            };
        }));

        const validSandwiches = sandwiches.filter(s => s !== null).sort((a, b) => a.rank - b.rank);
        if (validSandwiches.length === 0) return;

        sandwichContainer.innerHTML = '';
        validSandwiches.forEach(s => {
            const card = document.createElement('div');
            card.className = 'sandwich-card';
            card.dataset.rank = s.rank.toString().padStart(2, '0');
            card.innerHTML = `
                <h4>${s.title}</h4>
                <span class="score">Bull Rating: ${s.rating} / 10</span>
                <p>${s.description}</p>
            `;
            sandwichContainer.appendChild(card);
            
            // Re-observe for scroll reveal
            revealObserver.observe(card);
        });

    } catch (error) {
        console.error('Error loading sandwiches:', error);
    }
}

// AI Morning Blueprint Animation Logic
function initBlueprintAnimation() {
    const terminalBody = document.getElementById('terminal-body');
    const soulContent = document.getElementById('soul-content');
    const soulText = document.getElementById('soul-text');
    const blueprintComponent = document.getElementById('blueprint-component');

    if (!terminalBody || !soulContent || !soulText || !blueprintComponent) return;

    const terminalLines = [
        { tag: '[SYSTEM]', text: 'Initializing Blueprint Coach...' },
        { tag: '[SCAN]', text: 'Scanning /Career/GEMINI.md... Found 9 active projects.' },
        { tag: '[ANALYSIS]', text: 'Parsing professional_history.pdf... Context depth: High.' },
        { tag: '[IDENTITY]', text: 'Weighting: "Hacker at Heart" | Vision: 98%' },
        { tag: '[COORDINATE]', text: 'Correlating US Spotify Trends with release backlog...' },
        { tag: '[ACTION]', text: 'Synthesizing motivation matrix...' },
        { tag: '[STATUS]', text: 'Dispatching via Google Fi SMS Gateway...' }
    ];

    const pepTalk = "Jackson. You are the one who sees the signal in the noise when the charts look like chaos. You’ve built the skunkworks at Warner and solved the Sombr puzzle; today is just another block in the architecture. Own the frequency.";

    let terminalIndex = 0;
    let hasStarted = false;

    const runAnimation = () => {
        if (hasStarted) return;
        hasStarted = true;

        const addTerminalLine = () => {
            if (terminalIndex < terminalLines.length) {
                const line = terminalLines[terminalIndex];
                const lineEl = document.createElement('div');
                lineEl.className = 'terminal-line';
                lineEl.innerHTML = `<span class="tag">${line.tag}</span> ${line.text}`;
                terminalBody.appendChild(lineEl);
                
                // Trigger reflow for animation
                setTimeout(() => lineEl.classList.add('visible'), 50);
                
                terminalIndex++;
                setTimeout(addTerminalLine, 600);
            } else {
                // Terminal finished, show soul
                setTimeout(showSoul, 500);
            }
        };

        const showSoul = () => {
            soulContent.classList.add('visible');
            typeSoulText();
        };

        const typeSoulText = () => {
            let charIndex = 0;
            const type = () => {
                if (charIndex < pepTalk.length) {
                    soulText.textContent += pepTalk.charAt(charIndex);
                    charIndex++;
                    setTimeout(type, 30);
                }
            };
            type();
        };

        addTerminalLine();
    };

    // Use Intersection Observer to trigger when visible
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            runAnimation();
        }
    }, { threshold: 0.5 });

    observer.observe(blueprintComponent);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadGrowJournal();
    loadSandwiches();
    initBlueprintAnimation();
});
