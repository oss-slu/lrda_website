import { describe, it, expect, vi } from 'vitest';

describe('convertToJpeg', () => {
  const convertToJpeg = async (file: File): Promise<File> => {
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
        img.src = event?.target?.result as string;
      };

      reader.onerror = err => {
        reject(err);
      };

      reader.readAsDataURL(file);
    });
  };

  it('converts PNG image to JPEG File', async () => {
    const fakeBlob = new Blob(['fake-image-data'], { type: 'image/png' });
    const fakeFile = new File([fakeBlob], 'test-image.png', { type: 'image/png' });

    const mockToBlob = vi.fn(cb => cb(new Blob(['jpeg-data'], { type: 'image/jpeg' })));

    const originalFileReader = global.FileReader;
    const originalCreateElement = document.createElement.bind(document);
    const originalImage = global.Image;

    // Mock FileReader
    class MockFileReader {
      result = 'data:image/png;base64,fake';
      onload: Function = () => {};
      onerror: Function = () => {};
      readAsDataURL = vi.fn(function (this: MockFileReader) {
        setTimeout(() => {
          this.onload({ target: { result: this.result } });
        }, 0);
      });
    }
    global.FileReader = MockFileReader as any;

    // Mock canvas
    document.createElement = vi.fn((tag: string) => {
      if (tag === 'canvas') {
        return {
          getContext: vi.fn(() => ({
            drawImage: vi.fn(),
          })),
          toBlob: mockToBlob,
          width: 0,
          height: 0,
        } as any;
      }
      return originalCreateElement(tag);
    }) as any;

    // Mock Image
    const mockImageInstance = {
      set src(_val: string) {
        setTimeout(() => {
          mockImageInstance.onload?.();
        }, 0);
      },
      onload: null as (() => void) | null,
      width: 100,
      height: 100,
    };
    global.Image = vi.fn(() => mockImageInstance) as any;

    const jpegFile = await convertToJpeg(fakeFile);
    expect(jpegFile.type).toBe('image/jpeg');
    expect(jpegFile.name).toBe('test-image.jpg');

    // Restore original objects
    global.FileReader = originalFileReader;
    document.createElement = originalCreateElement;
    global.Image = originalImage;
  });
});
