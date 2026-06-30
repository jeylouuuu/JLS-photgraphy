const STORAGE_KEY = 'jieliezer-posts';
const form = document.getElementById('admin-form');
const titleInput = document.getElementById('title');
const categoryInput = document.getElementById('category');
const descriptionInput = document.getElementById('description');
const imageUrlInput = document.getElementById('image-url');
const imageFileInput = document.getElementById('image-file');
const postIdInput = document.getElementById('post-id');
const statusEl = document.getElementById('admin-status');
const postList = document.getElementById('admin-post-list');
const cancelEditButton = document.getElementById('cancel-edit');

function getPosts() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function renderPosts() {
  const posts = getPosts();
  if (!posts.length) {
    postList.innerHTML = '<p class="empty-state">No posts yet. Add your first gallery item above.</p>';
    return;
  }

  postList.innerHTML = posts
    .map((post) => `
      <article class="admin-post">
        <img src="${post.image || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80'}" alt="${post.title}" />
        <div class="admin-post-body">
          <div class="admin-post-meta">
            <strong>${post.title}</strong>
            <span>${post.category}</span>
          </div>
          <p>${post.description || 'No description yet.'}</p>
          <div class="admin-post-actions">
            <button class="button secondary" data-edit="${post.id}">Edit</button>
            <button class="button primary" data-delete="${post.id}">Delete</button>
          </div>
        </div>
      </article>
    `)
    .join('');
}

function resetForm() {
  form.reset();
  postIdInput.value = '';
  statusEl.textContent = '';
}

function showStatus(message) {
  statusEl.textContent = message;
}

async function handleImageInput() {
  const file = imageFileInput.files?.[0];
  if (!file) return null;

  if (!file.type.startsWith('image/')) {
    showStatus('Please choose an image file.');
    return null;
  }

  const reader = new FileReader();
  return new Promise((resolve) => {
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const imageBase64 = await handleImageInput();
  const posts = getPosts();
  const id = postIdInput.value || crypto.randomUUID();
  const payload = {
    id,
    title: titleInput.value.trim(),
    category: categoryInput.value,
    description: descriptionInput.value.trim(),
    image: imageBase64 || imageUrlInput.value.trim() || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80'
  };

  if (!payload.title) {
    showStatus('Please add a title.');
    return;
  }

  const existingIndex = posts.findIndex((post) => post.id === id);
  if (existingIndex >= 0) {
    posts[existingIndex] = payload;
  } else {
    posts.unshift(payload);
  }

  savePosts(posts);
  renderPosts();
  resetForm();
  showStatus('Post saved successfully.');
  window.location.href = 'index.html#portfolio';
});

postList.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const posts = getPosts();
  const id = button.dataset.edit || button.dataset.delete;
  if (button.dataset.edit) {
    const post = posts.find((item) => item.id === id);
    if (!post) return;

    titleInput.value = post.title;
    categoryInput.value = post.category;
    descriptionInput.value = post.description || '';
    imageUrlInput.value = post.image?.startsWith('data:image') ? '' : post.image || '';
    postIdInput.value = post.id;
    showStatus('Editing post. Update and save when ready.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (button.dataset.delete) {
    const filtered = posts.filter((item) => item.id !== id);
    savePosts(filtered);
    renderPosts();
    showStatus('Post deleted.');
  }
});

cancelEditButton.addEventListener('click', () => {
  resetForm();
});

renderPosts();
