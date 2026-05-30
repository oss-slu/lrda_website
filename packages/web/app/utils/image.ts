/**
 * Convert an image file to JPEG format using canvas.
 */
export async function convertToJpeg(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get canvas context'));
        }

        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          if (!blob) {
            return reject(new Error('Failed to convert image to JPEG'));
          }

          const jpegFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
            type: 'image/jpeg',
          });

          resolve(jpegFile);
        }, 'image/jpeg');
      };
      img.src = event.target?.result as string;
    };

    reader.onerror = err => {
      reject(err);
    };

    reader.readAsDataURL(file);
  });
}
