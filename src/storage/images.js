const MAX_IMAGE_DIM = 800;
const IMAGE_QUALITY = 0.75;
const imageKey = (cardId) => `srs-image-${cardId}`;

export function processImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not load image'));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMAGE_DIM || height > MAX_IMAGE_DIM) {
          if (width >= height) {
            height = Math.round(height * (MAX_IMAGE_DIM / width));
            width = MAX_IMAGE_DIM;
          } else {
            width = Math.round(width * (MAX_IMAGE_DIM / height));
            height = MAX_IMAGE_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY));
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export async function loadCardImage(cardId) {
  try {
    return localStorage.getItem(imageKey(cardId)) || null;
  } catch (_) {
    return null;
  }
}

export async function saveCardImage(cardId, dataUrl) {
  try {
    localStorage.setItem(imageKey(cardId), dataUrl);
    return true;
  } catch (e) {
    console.error('Image save failed:', e);
    return false;
  }
}

export async function removeCardImage(cardId) {
  try {
    localStorage.removeItem(imageKey(cardId));
  } catch (_) {}
}
