export const C = {
  ink: '#13151c',
  ink2: '#2a2e3a',
  muted: '#8b919e',
  line: '#dfe2e8',
  bg: '#f4f5f7',
  card: '#ffffff',
  accent: '#c8821f',
  accentSoft: '#fbf0dd',
  danger: '#d33b3b',
  dangerSoft: '#fbe5e5',
  ok: '#2f9e6b',
};

export const CATEGORIES = ['Wigs', 'Extensions', 'Care', 'Tools', 'Accessories'];
export const LOW_STOCK_THRESHOLD = 5;

export const fmtMKD = (n) =>
  new Intl.NumberFormat('mk-MK', { maximumFractionDigits: 0 }).format(n) + ' ден.';

export const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('mk-MK', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('mk-MK', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Compress a File/Blob to a JPEG under ~150KB (800px max side, quality .75).
 * Returns { blob, previewUrl } — blob is what gets uploaded to Storage,
 * previewUrl (an object URL) is just for showing it in the picker before save.
 * Caller is responsible for URL.revokeObjectURL(previewUrl) once it's no longer shown.
 */
export async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Image compression failed'));
          resolve({ blob, previewUrl: URL.createObjectURL(blob) });
        }, 'image/jpeg', 0.75);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
