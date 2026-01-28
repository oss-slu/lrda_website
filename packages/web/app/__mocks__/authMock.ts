/**
 * Shared auth mock for tests.
 * Use this to mock the authStore in tests instead of Firebase.
 */

export interface MockUser {
  uid: string;
  name: string;
  email: string;
  roles?: {
    administrator?: boolean;
    contributor?: boolean;
  };
  isInstructor?: boolean;
}

export interface MockAuthState {
  user: MockUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: jest.Mock;
  logout: jest.Mock;
  signup: jest.Mock;
  refreshUser: jest.Mock;
  isAdmin: jest.Mock;
}

export const createMockAuthState = (overrides: Partial<MockAuthState> = {}): MockAuthState => ({
  user: null,
  isLoggedIn: false,
  isLoading: false,
  isInitialized: true,
  login: jest.fn().mockResolvedValue('success'),
  logout: jest.fn().mockResolvedValue(undefined),
  signup: jest.fn().mockResolvedValue(undefined),
  refreshUser: jest.fn().mockResolvedValue(undefined),
  isAdmin: jest.fn().mockReturnValue(false),
  ...overrides,
});

export const mockLoggedInUser: MockUser = {
  uid: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  roles: {
    administrator: false,
    contributor: true,
  },
  isInstructor: false,
};

export const mockAdminUser: MockUser = {
  uid: 'admin-user-id',
  name: 'Admin User',
  email: 'admin@example.com',
  roles: {
    administrator: true,
    contributor: true,
  },
  isInstructor: true,
};

export const mockInstructorUser: MockUser = {
  uid: 'instructor-user-id',
  name: 'Instructor User',
  email: 'instructor@example.com',
  roles: {
    administrator: false,
    contributor: true,
  },
  isInstructor: true,
};

/**
 * Creates a mock for the useAuthStore hook.
 * Usage in tests:
 *
 * const mockAuthState = createMockAuthState({ user: mockLoggedInUser, isLoggedIn: true });
 * jest.mock('../lib/stores/authStore', () => ({
 *   useAuthStore: jest.fn(selector => selector ? selector(mockAuthState) : mockAuthState),
 * }));
 */
export const createAuthStoreMock = (authState: MockAuthState) => ({
  useAuthStore: jest.fn((selector?: (state: MockAuthState) => any) =>
    selector ? selector(authState) : authState,
  ),
});
