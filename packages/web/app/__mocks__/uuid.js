// Mock for uuid package
import { vi } from 'vitest';

export const v4 = vi.fn(() => 'mock-uuid-v4');
export const v1 = vi.fn(() => 'mock-uuid-v1');
export const validate = vi.fn(() => true);
export const version = vi.fn(() => 4);
