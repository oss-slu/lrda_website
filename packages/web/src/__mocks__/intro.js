// Mock for intro.js package
import { vi } from 'vitest';

const introJs = vi.fn(() => ({
  setOptions: vi.fn().mockReturnThis(),
  start: vi.fn().mockReturnThis(),
  exit: vi.fn().mockReturnThis(),
  goToStep: vi.fn().mockReturnThis(),
  nextStep: vi.fn().mockReturnThis(),
  previousStep: vi.fn().mockReturnThis(),
  refresh: vi.fn().mockReturnThis(),
  setOption: vi.fn().mockReturnThis(),
  addStep: vi.fn().mockReturnThis(),
  removeStep: vi.fn().mockReturnThis(),
  removeSteps: vi.fn().mockReturnThis(),
}));

export default introJs;
