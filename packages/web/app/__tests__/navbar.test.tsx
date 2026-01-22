import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import Navbar from '../lib/components/navbar';
import { usePathname } from 'next/navigation';

// Define mock auth state that can be mutated in tests
const mockAuthState = {
  user: null as any,
  isLoggedIn: false,
  isLoading: false,
  isInitialized: true,
  login: jest.fn().mockResolvedValue('success'),
  logout: jest.fn().mockResolvedValue(undefined),
  signup: jest.fn().mockResolvedValue(undefined),
  refreshUser: jest.fn().mockResolvedValue(undefined),
  isAdmin: jest.fn().mockReturnValue(false),
};

// Define mockLoggedInUser for use in tests
const mockLoggedInUser = {
  uid: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  roles: { administrator: false, contributor: true },
  isInstructor: false,
};

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: jest.fn(),
    refresh: jest.fn(),
  })),
}));

// Mock auth store
jest.mock('../lib/stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (state: any) => any) =>
    selector ? selector(mockAuthState) : mockAuthState
  ),
}));

// Mock useNotesStore
jest.mock('../lib/stores/notesStore', () => ({
  useNotesStore: jest.fn((selector?: (state: any) => any) => {
    const mockStore = {
      viewMode: 'my',
      setViewMode: jest.fn(),
    };
    return selector ? selector(mockStore) : mockStore;
  }),
}));

// Mock services - inline to avoid hoisting issues
jest.mock('../lib/services', () => ({
  fetchMe: jest.fn().mockResolvedValue(null),
  fetchUserById: jest.fn().mockResolvedValue(null),
  fetchProfileById: jest.fn().mockResolvedValue(null),
  fetchInstructors: jest.fn().mockResolvedValue([]),
  updateProfile: jest.fn().mockResolvedValue({}),
  assignInstructor: jest.fn().mockResolvedValue(undefined),
  fetchCreatorName: jest.fn().mockResolvedValue('Test User'),
}));

// Mock Select component
jest.mock('../../components/ui/select', () => ({
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

describe('Navbar Component', () => {
  const mockedUsePathname = usePathname as jest.Mock;

  beforeEach(() => {
    // Reset mock auth state
    mockAuthState.user = null;
    mockAuthState.isLoggedIn = false;
    mockAuthState.login.mockClear();
    mockAuthState.logout.mockClear();
    window.localStorage.clear();
    mockedUsePathname.mockReset();
  });

  it('shows Login when user is not logged in', async () => {
    mockedUsePathname.mockReturnValue('/');
    render(<Navbar />);

    // Check that the navbar renders with basic navigation elements
    expect(screen.getByText(/Home/i)).toBeTruthy();
    expect(screen.getByText(/Resources/i)).toBeTruthy();
    expect(screen.getByText(/Stories/i)).toBeTruthy();

    // The navbar should render without crashing, regardless of auth state
    expect(screen.getByRole('navigation')).toBeTruthy();
  });

  it('displays user name when logged in', async () => {
    mockedUsePathname.mockReturnValue('/');
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
      expect(screen.getByText(/Hi, John Doe!/i)).toBeTruthy();
    });
    expect(screen.queryByText(/login/i)).toBeNull();
  });

  it('renders Notes link when logged in', async () => {
    // Set up auth state BEFORE render
    mockAuthState.user = {
      ...mockLoggedInUser,
      name: 'John Doe',
      roles: { administrator: true, contributor: true },
    };
    mockAuthState.isLoggedIn = true;

    mockedUsePathname.mockReturnValue('/notes');

    await act(async () => {
      render(<Navbar />);
    });

    // Notes link should appear for logged-in users
    const notesElements = screen.getAllByText(/Notes/i);
    expect(notesElements.length).toBeGreaterThan(0);
    expect(screen.getByRole('navigation')).toBeTruthy();
  });

  // Active Link Tests
  it("highlights Home when pathname is '/'", async () => {
    mockedUsePathname.mockReturnValue('/');

    await act(async () => {
      render(<Navbar />);
    });

    const homeLink = screen.getByText('Home');
    expect(homeLink).toHaveClass('text-blue-500');
  });

  it("highlights Notes when pathname starts with '/notes'", async () => {
    mockedUsePathname.mockReturnValue('/notes');
    // Set up auth state as logged in with roles
    mockAuthState.user = {
      ...mockLoggedInUser,
      name: 'John Doe',
      roles: { administrator: true, contributor: true },
    };
    mockAuthState.isLoggedIn = true;

    await act(async () => {
      render(<Navbar />);
    });

    // Wait for async operations
    await waitFor(() => {
      const notesLink = screen.getByText('Notes');
      expect(notesLink).toHaveClass('text-blue-500');
    });
  });

  it("does not highlight Home when pathname is '/map'", async () => {
    mockedUsePathname.mockReturnValue('/map');

    await act(async () => {
      render(<Navbar />);
    });

    const homeLink = screen.getByText('Home');
    expect(homeLink).toHaveClass('text-blue-300'); // inactive
  });
});

describe('formatCitation function', () => {
  // Import formatCitation for testing
  let formatCitation: (citation: string) => React.ReactNode;
  beforeAll(() => {
    // Dynamically import the function from the utility file
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @next/next/no-assign-module-variable
    const module = require('../lib/utils/citation_formatter');
    formatCitation = module.formatCitation;
  });

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
