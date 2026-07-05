const form = document.getElementById('contact-form');
const status = document.querySelector('.form-status');
const portfolioGrid = document.getElementById('portfolio-grid');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');
const STORAGE_KEY = 'jieliezer-posts';
let galleryItems = [];
let currentLightboxIndex = 0;
let activeFilter = 'all';

async function getStoredPosts() {
  try {
    // Always fetch from server first to get latest uploads
    const response = await fetch('/api/images');
    if (!response.ok) {
      throw new Error('Unable to load gallery');
    }
    const posts = await response.json();
    if (Array.isArray(posts) && posts.length > 0) {
      // Save to localStorage for offline access
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
      return posts;
    }
    
    // If server has no posts, check localStorage
    const localPosts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return localPosts;
  } catch (error) {
    // If fetch fails, use localStorage
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  }
}

function getFilteredItems() {
  return activeFilter === 'all'
    ? galleryItems
    : galleryItems.filter((item) => item.category === activeFilter);
}

function openLightbox() {
  const visibleItems = getFilteredItems();
  const item = visibleItems[currentLightboxIndex];
  if (!item) return;
  lightboxImage.src = item.image;
  lightboxImage.alt = item.title;
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
}

function showPrevImage() {
  const visibleItems = getFilteredItems();
  if (!visibleItems.length) return;
  currentLightboxIndex = (currentLightboxIndex - 1 + visibleItems.length) % visibleItems.length;
  openLightbox();
}

function showNextImage() {
  const visibleItems = getFilteredItems();
  if (!visibleItems.length) return;
  currentLightboxIndex = (currentLightboxIndex + 1) % visibleItems.length;
  openLightbox();
}

async function renderPortfolio() {
  const posts = await getStoredPosts();
  const fallback = [
    { id: 'demo-1', title: 'Caohagan Island Pre-Wedding Session', category: 'engagement', image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80', description: 'Engagement' },
    { id: 'demo-2', title: 'Plantation Bay Family Portraits', category: 'family', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80', description: 'Family' },
    { id: 'demo-3', title: 'Moalboal Wedding Proposal', category: 'proposal', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80', description: 'Proposal' },
    { id: 'demo-4', title: 'Shangri-La Mactan Destination Wedding', category: 'wedding', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80', description: 'Real Weddings' }
  ];

  const items = posts.length ? posts : fallback;
  galleryItems = items;
  portfolioGrid.innerHTML = items.map((post, index) => `
    <article class="portfolio-card" data-category="${post.category}" data-index="${index}">
      <img src="${post.image}" alt="${post.title}" />
      <div class="card-content">
        <p>${post.description || post.category}</p>
        <h3>${post.title}</h3>
      </div>
    </article>
  `).join('');

  const cards = document.querySelectorAll('.portfolio-card');
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const itemIndex = Number(card.dataset.index);
      const visibleItems = getFilteredItems();
      currentLightboxIndex = visibleItems.findIndex(
        (item) => item.id === galleryItems[itemIndex].id
      );
      if (currentLightboxIndex === -1) {
        currentLightboxIndex = 0;
      }
      openLightbox();
    });
  });

  applyFilters();
}

function applyFilters() {
  const filters = document.querySelectorAll('.filter');
  const cards = document.querySelectorAll('.portfolio-card');

  filters.forEach((button) => {
    if (!button.dataset.filterListenerAttached) {
      button.addEventListener('click', () => {
        filters.forEach((item) => item.classList.remove('active'));
        button.classList.add('active');

        activeFilter = button.dataset.filter;
        const filter = activeFilter;
        cards.forEach((card) => {
          const category = card.dataset.category;
          const matches = filter === 'all' || filter === category;
          card.classList.toggle('is-hidden', !matches);
        });
      });
      button.dataset.filterListenerAttached = true;
    }
  });
}

renderPortfolio();

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', showPrevImage);
lightboxNext.addEventListener('click', showNextImage);
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (event) => {
  if (!lightbox.classList.contains('is-open')) return;
  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') showPrevImage();
  if (event.key === 'ArrowRight') showNextImage();
});

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = data.get('name')?.toString().trim() || 'there';
    const email = data.get('email')?.toString().trim() || '';
    const date = data.get('date')?.toString().trim() || 'Not specified';
    const message = data.get('message')?.toString().trim() || '';

    const subject = encodeURIComponent(`Wedding inquiry from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nWedding Date: ${date}\n\nMessage:\n${message}`
    );

    status.textContent = `Thanks, ${name}! Opening your email app with your inquiry.`;
    window.location.href = `mailto:hello@jieliezersapanta.com?subject=${subject}&body=${body}`;
    form.reset();
  });
}

const revealTargets = document.querySelectorAll('.section-heading, .stats div, .portfolio-card, .blog-card, blockquote, .contact-form, .contact-details, .hero-card');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal', 'is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealTargets.forEach((target) => {
  target.classList.add('reveal');
  revealObserver.observe(target);
});
