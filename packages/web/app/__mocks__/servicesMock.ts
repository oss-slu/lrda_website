/**
 * Shared services mock for tests.
 * Use this to mock the services in tests.
 */

export const mockUserProfile = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  isInstructor: false,
  createdAt: new Date().toISOString(),
};

export const mockUserData = {
  uid: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  isInstructor: false,
  roles: {
    administrator: false,
    contributor: true,
  },
};

export const mockInstructors = [
  {
    id: 'instructor-1',
    name: 'Instructor One',
    email: 'instructor1@example.com',
    isInstructor: true,
  },
  {
    id: 'instructor-2',
    name: 'Instructor Two',
    email: 'instructor2@example.com',
    isInstructor: true,
  },
];

/**
 * Creates mocks for user service functions.
 */
export const createUserServiceMocks = () => ({
  fetchMe: jest.fn().mockResolvedValue(mockUserProfile),
  fetchUserById: jest.fn().mockResolvedValue(mockUserData),
  fetchProfileById: jest.fn().mockResolvedValue(mockUserProfile),
  fetchInstructors: jest.fn().mockResolvedValue(mockInstructors),
  updateProfile: jest.fn().mockResolvedValue(mockUserProfile),
  assignInstructor: jest.fn().mockResolvedValue(undefined),
  fetchCreatorName: jest.fn().mockResolvedValue('Test User'),
});

/**
 * Creates mocks for admin service functions.
 */
export const createAdminServiceMocks = () => ({
  fetchAllUsers: jest.fn().mockResolvedValue([mockUserData]),
  fetchPendingApplications: jest.fn().mockResolvedValue([]),
  getAdminStats: jest.fn().mockResolvedValue({
    totalUsers: 10,
    totalAdmins: 1,
    totalInstructors: 2,
    pendingApplications: 0,
  }),
  approveApplication: jest.fn().mockResolvedValue(true),
  rejectApplication: jest.fn().mockResolvedValue(true),
});

/**
 * Creates mocks for instructor service functions.
 */
export const createInstructorServiceMocks = () => ({
  fetchStudents: jest.fn().mockResolvedValue([]),
  requestApproval: jest.fn().mockRejectedValue(new Error('Not implemented')),
  sendInstructorNotification: jest.fn().mockResolvedValue(true),
});
