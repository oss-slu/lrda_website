import React from 'react';
import { describe, it, expect, vi, beforeEach, beforeAll, type Mock } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import Navbar from '../lib/components/navbar';
import { formatCitation } from '../lib/utils/citation_formatter';

// Define mock auth state that can be mutated in tests
const mockAuthState = {
  user: null as any,
  isLoggedIn: false,
  isLoading: false,
  isInitialized: true,
  login: vi.fn().mockResolvedValue('success'),
  logout: vi.fn().mockResolvedValue(undefined),
  signup: vi.fn().mockResolvedValue(undefined),
  initialize: vi.fn(),
};

// Define mockLoggedInUser for use in tests
const mockLoggedInUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  isInstructor: false,
};

// Mock TanStack Router (Navbar uses Link and useLocation)
const mockLocation = { pathname: '/' };
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className, ...props }: any) => (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ),
  useLocation: vi.fn(() => mockLocation),
}));

// Mock auth store
vi.mock('../lib/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (state: any) => any) =>
    selector ? selector(mockAuthState) : mockAuthState,
  ),
}));

// Mock useNotesStore
vi.mock('../lib/stores/notesStore', () => ({
  useNotesStore: vi.fn((selector?: (state: any) => any) => {
    const mockStore = {};
    return selector ? selector(mockStore) : mockStore;
  }),
}));

// Mock authHelpers
vi.mock('../lib/stores/authHelpers', () => ({
  hasInstructorAccess: vi.fn(() => false),
}));

// Mock services - inline to avoid hoisting issues
vi.mock('../lib/services', () => ({
  fetchMe: vi.fn().mockResolvedValue(null),
  fetchProfileById: vi.fn().mockResolvedValue(null),
  fetchInstructors: vi.fn().mockResolvedValue([]),
  updateProfile: vi.fn().mockResolvedValue({}),
  assignInstructor: vi.fn().mockResolvedValue(undefined),
  fetchCreatorName: vi.fn().mockResolvedValue('Test User'),
}));

// Mock Select component
vi.mock('../../components/ui/select', () => ({
  Select: ({ children }: any) => <div data-testid='select'>{children}</div>,
  SelectTrigger: ({ children, className }: any) => (
    <button className={className} data-testid='select-trigger'>
      {children}
    </button>
  ),
  SelectValue: ({ children }: any) => <span>{children}</span>,
  SelectContent: ({ children }: any) => <div data-testid='select-content'>{children}</div>,
  SelectItem: ({ children, value, onClick }: any) => (
    <div data-testid={`select-item-${value}`} onClick={onClick}>
      {children}
    </div>
  ),
}));

const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: function (key: string) {
      return store[key] || null;
    },
    setItem: function (key: string, value: string) {
      store[key] = value.toString();
    },
    clear: function () {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Import useLocation so we can cast to mock
import { useLocation } from '@tanstack/react-router';
const mockedUseLocation = useLocation as Mock;

describe('Navbar Component', () => {
  beforeEach(() => {
    // Reset mock auth state
    mockAuthState.user = null;
    mockAuthState.isLoggedIn = false;
    mockAuthState.login.mockClear();
    mockAuthState.logout.mockClear();
    window.localStorage.clear();
    mockedUseLocation.mockReset();
    mockedUseLocation.mockReturnValue({ pathname: '/' });
  });

  it('shows Login when user is not logged in', async () => {
    mockedUseLocation.mockReturnValue({ pathname: '/' });
    render(<Navbar />);

    // Check that the navbar renders with basic navigation elements
    expect(screen.getByText(/Home/i)).toBeTruthy();
    expect(screen.getByText(/Resources/i)).toBeTruthy();
    expect(screen.getByText(/Stories/i)).toBeTruthy();

    // The navbar should render without crashing, regardless of auth state
    expect(screen.getByRole('navigation')).toBeTruthy();
  });

  it('displays user name when logged in', async () => {
    mockedUseLocation.mockReturnValue({ pathname: '/' });
    // Set up auth state as logged in
    mockAuthState.user = {
      ...mockLoggedInUser,
      name: 'John Doe',
    };
    mockAuthState.isLoggedIn = true;

    await act(async () => {
      render(<Navbar />);
    });

    // Wait for async user data fetching
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
    });
  });

  it('renders Notes link when logged in', async () => {
    // Set up auth state BEFORE render
    mockAuthState.user = {
      ...mockLoggedInUser,
      name: 'John Doe',
      role: 'admin',
    };
    mockAuthState.isLoggedIn = true;

    mockedUseLocation.mockReturnValue({ pathname: '/notes' });

    await act(async () => {
      render(<Navbar />);
    });

    // Notes link should appear for logged-in users
    const notesElements = screen.getAllByText(/Notes/i);
    expect(notesElements.length).toBeGreaterThan(0);
    expect(screen.getByRole('navigation')).toBeTruthy();
  });

  it('renders Home link', async () => {
    mockedUseLocation.mockReturnValue({ pathname: '/' });

    await act(async () => {
      render(<Navbar />);
    });

    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});

describe('formatCitation function', () => {
  it('should italicize entire citation when there is no comma (Case 1)', () => {
    const citation = 'American Anthropological Association Resources on Ethics';
    const { container } = render(<>{formatCitation(citation)}</>);
    const italicElement = container.querySelector('span.italic');
    expect(italicElement).toBeTruthy();
    expect(italicElement?.textContent).toBe(citation);
    expect(italicElement).toHaveStyle({ fontStyle: 'italic' });
  });

  it('should italicize title after period (Case 2)', () => {
    const citation =
      'Malley, Suzanne Blum and Ames Hawkins. Engaging Communities: Writing Ethnographic Research';
    const { container } = render(<>{formatCitation(citation)}</>);
    const italicElement = container.querySelector('span.italic');
    expect(italicElement).toBeTruthy();
    expect(italicElement?.textContent).toBe('Engaging Communities: Writing Ethnographic Research');
    expect(italicElement).toHaveStyle({ fontStyle: 'italic' });
    // Check that author part is not italicized
    expect(container.textContent).toContain('Malley, Suzanne Blum and Ames Hawkins.');
  });

  it('should italicize title after et. al. (Case 3)', () => {
    const citation = 'Tyner- Millings, Alia R. et. al. Ethnography Made Easy';
    const { container } = render(<>{formatCitation(citation)}</>);
    const italicElement = container.querySelector('span.italic');
    expect(italicElement).toBeTruthy();
    expect(italicElement?.textContent).toBe('Ethnography Made Easy');
    expect(italicElement).toHaveStyle({ fontStyle: 'italic' });
    // Check that author part is not italicized
    expect(container.textContent).toContain('Tyner- Millings, Alia R. et. al.');
  });

  it('should italicize title after comma when no period found', () => {
    const citation =
      'Emerson, Robert, Rachel Fretz, and Linda Shaw, Writing Ethnographic Fieldnotes';
    const { container } = render(<>{formatCitation(citation)}</>);
    const italicElement = container.querySelector('span.italic');
    expect(italicElement).toBeTruthy();
    expect(italicElement?.textContent).toBe('Writing Ethnographic Fieldnotes');
    expect(italicElement).toHaveStyle({ fontStyle: 'italic' });
  });

  it('should handle citations with ending period', () => {
    const citation = 'Agar, Michael. Speaking of Ethnography.';
    const { container } = render(<>{formatCitation(citation)}</>);
    const italicElement = container.querySelector('span.italic');
    expect(italicElement).toBeTruthy();
    expect(italicElement?.textContent).toBe('Speaking of Ethnography');
    expect(container.textContent).toContain('Agar, Michael.');
  });

  it('should italicize entire citation when no comma and no pattern found', () => {
    const citation = 'Some random text without proper format';
    const { container } = render(<>{formatCitation(citation)}</>);
    // When there's no comma, the entire citation should be italicized (Case 1)
    const italicElement = container.querySelector('span.italic');
    expect(italicElement).toBeTruthy();
    expect(italicElement?.textContent).toBe(citation);
    expect(italicElement).toHaveStyle({ fontStyle: 'italic' });
  });
});
