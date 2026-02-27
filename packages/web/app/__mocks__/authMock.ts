/**
 * Shared auth mock for tests.
 * Use this to mock the authStore in tests.
 */

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin';
  isInstructor?: boolean;
  instructorId?: string | null;
}

export interface MockAuthState {
  user: MockUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: jest.Mock;
  logout: jest.Mock;
  signup: jest.Mock;
  initialize: jest.Mock;
}

export const createMockAuthState = (overrides: Partial<MockAuthState> = {}): MockAuthState => ({
  user: null,
  isLoggedIn: false,
  isLoading: false,
  isInitialized: true,
  login: jest.fn().mockResolvedValue('success'),
  logout: jest.fn().mockResolvedValue(undefined),
  signup: jest.fn().mockResolvedValue(undefined),
  initialize: jest.fn(),
  ...overrides,
});

export const mockLoggedInUser: MockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  isInstructor: false,
};

export const mockAdminUser: MockUser = {
  id: 'admin-user-id',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
  isInstructor: true,
};

export const mockInstructorUser: MockUser = {
  id: 'instructor-user-id',
  name: 'Instructor User',
  email: 'instructor@example.com',
  role: 'user',
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
