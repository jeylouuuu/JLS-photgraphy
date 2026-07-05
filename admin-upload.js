const uploadForm = document.getElementById('photo-upload-form');
const uploadStatus = document.getElementById('upload-status');
const STORAGE_KEY = 'jieliezer-posts';

async function handlePhotoUpload(event) {
  event.preventDefault();
  if (!uploadForm) return;

  const data = new FormData(uploadForm);
  const title = data.get('title')?.toString().trim();
  const category = data.get('category')?.toString() || 'engagement';
  const description = data.get('description')?.toString().trim() || '';
  const imageFile = data.get('image');

  if (!title) {
    if (uploadStatus) uploadStatus.textContent = 'Please add a title for the photo.';
    return;
  }

  if (!imageFile || typeof imageFile === 'string') {
    if (uploadStatus) uploadStatus.textContent = 'Please choose an image file.';
    return;
  }

  if (uploadStatus) uploadStatus.textContent = 'Saving your photo...';

  const reader = new FileReader();
  const imageBase64 = await new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read the selected image.'));
    reader.readAsDataURL(imageFile);
  });

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, description, image: imageBase64 })
    });

    if (!response.ok) {
      throw new Error('Unable to save the photo.');
    }

    const newPost = await response.json();
    
    // Also save to localStorage so main page sees it immediately
    const posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    posts.unshift(newPost);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));

    uploadForm.reset();
    if (uploadStatus) uploadStatus.textContent = 'Your photo was saved to the gallery! Refresh the main page to see it.';
  } catch (error) {
    if (uploadStatus) uploadStatus.textContent = error.message || 'Unable to save the photo.';
  }
}

if (uploadForm) {
  uploadForm.addEventListener('submit', handlePhotoUpload);
}
