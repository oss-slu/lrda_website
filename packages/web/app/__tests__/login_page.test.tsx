import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Page from '../login/page';
import { createMockAuthState, mockLoggedInUser } from '../__mocks__/authMock';

// Create mock auth state
const mockAuthState = createMockAuthState();

// Mock auth store
jest.mock('../lib/stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (state: any) => any) =>
    selector ? selector(mockAuthState) : mockAuthState
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
    expect(screen.getByPlaceholderText('Email...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password...')).toBeInTheDocument();
    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('captures username input', () => {
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText('Email...'), { target: { value: 'testuser' } });
    expect((screen.getByPlaceholderText('Email...') as HTMLInputElement).value).toBe('testuser');
  });

  it('captures password input', () => {
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText('Password...'), { target: { value: 'testpass' } });
    expect((screen.getByPlaceholderText('Password...') as HTMLInputElement).value).toBe('testpass');
  });
});
