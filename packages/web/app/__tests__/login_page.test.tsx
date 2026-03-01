import { render, screen, fireEvent } from '@testing-library/react';
import Page from '../login/page';
import { createMockAuthState } from '../__mocks__/authMock';

// Create mock auth state
const mockAuthState = createMockAuthState();

// Mock auth store
jest.mock('../lib/stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (state: any) => any) =>
    selector ? selector(mockAuthState) : mockAuthState,
  ),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  })),
}));

describe('Login Page Component', () => {
  beforeEach(() => {
    // Reset mock state
    mockAuthState.user = null;
    mockAuthState.isLoggedIn = false;
    mockAuthState.login.mockReset();
    mockAuthState.login.mockResolvedValue('success');
  });

  it('renders the page component without crashing', () => {
    render(<Page />);
  });

  it('renders essential elements', () => {
    render(<Page />);
    expect(screen.getByPlaceholderText('m@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('captures username input', () => {
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText('m@example.com'), { target: { value: 'testuser' } });
    expect((screen.getByPlaceholderText('m@example.com') as HTMLInputElement).value).toBe('testuser');
  });

  it('captures password input', () => {
    render(<Page />);
    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });
    expect((passwordInput as HTMLInputElement).value).toBe('testpass');
  });
});
