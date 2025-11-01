// Mock for intro.js package
const introJs = jest.fn(() => ({
  setOptions: jest.fn().mockReturnThis(),
  start: jest.fn().mockReturnThis(),
  exit: jest.fn().mockReturnThis(),
  goToStep: jest.fn().mockReturnThis(),
  nextStep: jest.fn().mockReturnThis(),
  previousStep: jest.fn().mockReturnThis(),
  refresh: jest.fn().mockReturnThis(),
  setOption: jest.fn().mockReturnThis(),
  addStep: jest.fn().mockReturnThis(),
  removeStep: jest.fn().mockReturnThis(),
  removeSteps: jest.fn().mockReturnThis(),
}));

module.exports = introJs;
module.exports.default = introJs;

