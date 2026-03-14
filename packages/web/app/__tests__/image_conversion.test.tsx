import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { convertToJpeg } from '../lib/utils/image';

describe('convertToJpeg', () => {
  let originalFileReader: typeof FileReader;
  let originalCreateElement: typeof document.createElement;
  let originalImage: typeof Image;

  beforeEach(() => {
    originalFileReader = global.FileReader;
    originalCreateElement = document.createElement.bind(document);
    originalImage = global.Image;
  });

  afterEach(() => {
    // Restore globals even if the test fails
    global.FileReader = originalFileReader;
    document.createElement = originalCreateElement;
    global.Image = originalImage;
  });

  it('converts PNG image to JPEG File', async () => {
    const fakeBlob = new Blob(['fake-image-data'], { type: 'image/png' });
    const fakeFile = new File([fakeBlob], 'test-image.png', { type: 'image/png' });

    const mockToBlob = vi.fn(cb => cb(new Blob(['jpeg-data'], { type: 'image/jpeg' })));

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
    global.Image = vi.fn(function () { return mockImageInstance; }) as any;

    const jpegFile = await convertToJpeg(fakeFile);
    expect(jpegFile.type).toBe('image/jpeg');
    expect(jpegFile.name).toBe('test-image.jpg');
  });
});
