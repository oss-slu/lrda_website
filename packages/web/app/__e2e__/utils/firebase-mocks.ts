// Firebase mocks for Playwright E2E tests
export const mockFirebaseAuth = {
  currentUser: {
    uid: 'mock-user-uid-123',
    email: 'mock@test.com',
    displayName: 'Mock User'
  },
  onAuthStateChanged: (callback: any) => {
    callback({
      uid: 'mock-user-uid-123',
      email: 'mock@test.com',
      displayName: 'Mock User'
    });
    return () => {};
  },
  signInWithEmailAndPassword: async (email: string, password: string) => ({
    user: {
      uid: 'mock-user-uid-123',
      email,
      displayName: 'Mock User'
    }
  }),
  createUserWithEmailAndPassword: async (email: string, password: string) => ({
    user: {
      uid: 'mock-user-uid-456',
      email,
      displayName: 'Mock User'
    }
  }),
  signOut: async () => Promise.resolve()
};

export const mockFirestore = {
  collection: (collectionName: string) => ({
    doc: (docId: string) => ({
      get: async () => ({
        exists: true,
        data: () => ({
          uid: docId,
          email: 'mock@test.com',
          name: 'Mock User',
          roles: { administrator: true, contributor: true },
          isInstructor: false,
          createdAt: new Date('2025-01-01')
        })
      }),
      set: async (data: any) => Promise.resolve(),
      update: async (data: any) => Promise.resolve(),
      delete: async () => Promise.resolve()
    }),
    add: async (data: any) => Promise.resolve({ id: 'mock-doc-id' }),
    where: (field: string, operator: string, value: any) => ({
      get: async () => ({
        docs: [{
          id: 'mock-doc-id',
          data: () => ({
            uid: 'mock-user-uid-123',
            email: 'mock@test.com',
            name: 'Mock User',
            roles: { administrator: true, contributor: true },
            isInstructor: false
          })
        }]
      })
    })
  }),
  doc: (collectionName: string, docId: string) => ({
    get: async () => ({
      exists: true,
      data: () => ({
        uid: docId,
        email: 'mock@test.com',
        name: 'Mock User',
        roles: { administrator: true, contributor: true },
        isInstructor: false,
        createdAt: new Date('2025-01-01')
      })
    }),
    set: async (data: any) => Promise.resolve(),
    update: async (data: any) => Promise.resolve(),
    delete: async () => Promise.resolve()
  }),
  getDoc: async (docRef: any) => ({
    exists: true,
    data: () => ({
      uid: 'mock-user-uid-123',
      email: 'mock@test.com',
      name: 'Mock User',
      roles: { administrator: true, contributor: true },
      isInstructor: false,
      createdAt: new Date('2025-01-01')
    })
  }),
  updateDoc: async (docRef: any, data: any) => Promise.resolve(),
  setDoc: async (docRef: any, data: any) => Promise.resolve(),
  deleteDoc: async (docRef: any) => Promise.resolve(),
  query: (collectionRef: any, ...constraints: any[]) => ({
    get: async () => ({
      docs: [{
        id: 'mock-doc-id',
        data: () => ({
          uid: 'mock-user-uid-123',
          email: 'mock@test.com',
          name: 'Mock User',
          roles: { administrator: true, contributor: true },
          isInstructor: false
        })
      }]
    })
  }),
  where: (field: string, operator: string, value: any) => ({
    get: async () => ({
      docs: [{
        id: 'mock-doc-id',
        data: () => ({
          uid: 'mock-user-uid-123',
          email: 'mock@test.com',
          name: 'Mock User',
          roles: { administrator: true, contributor: true },
          isInstructor: false
        })
      }]
    })
  })
};

export const mockUserClass = {
  getInstance: () => ({
    login: async (email: string, password: string) => Promise.resolve(true),
    logout: async () => Promise.resolve(),
    getCurrentUser: () => ({
      uid: 'mock-user-uid-123',
      email: 'mock@test.com',
      name: 'Mock User'
    }),
    isLoggedIn: () => true,
    getUserData: async () => ({
      uid: 'mock-user-uid-123',
      email: 'mock@test.com',
      name: 'Mock User',
      roles: { administrator: true, contributor: true },
      isInstructor: false
    })
  })
};

export const mockApiService = {
  fetchUserData: async (uid: string) => ({
    uid,
    email: 'mock@test.com',
    name: 'Mock User',
    roles: { administrator: true, contributor: true },
    isInstructor: false,
    students: [],
    parentInstructorId: null
  }),
  updateUserData: async (uid: string, data: any) => Promise.resolve(true),
  createUser: async (userData: any) => Promise.resolve(true)
};

// Mock data constants
export const mockUsers = {
  admin: {
    uid: 'mock-admin-uid-123',
    email: 'admin@test.com',
    name: 'Mock Admin User',
    roles: { administrator: true, contributor: true },
    isInstructor: false,
    createdAt: new Date('2025-01-01')
  },
  instructor: {
    uid: 'mock-instructor-uid-456',
    email: 'instructor@test.com',
    name: 'Mock Instructor User',
    roles: { administrator: true, contributor: true },
    isInstructor: true,
    description: 'Test instructor description',
    students: [],
    createdAt: new Date('2025-01-01')
  },
  student: {
    uid: 'mock-student-uid-789',
    email: 'student@test.com',
    name: 'Mock Student User',
    roles: { contributor: true },
    isInstructor: false,
    parentInstructorId: 'mock-instructor-uid-456',
    createdAt: new Date('2025-01-01')
  }
};

// Helper function to setup Firebase mocks
export const setupFirebaseMocks = async (page: any, customMocks: any = {}) => {
  await page.addInitScript((mocks: any) => {
    // Mock Firebase
    (window as any).firebase = {
      auth: () => mocks.auth || mockFirebaseAuth,
      firestore: () => mocks.firestore || mockFirestore
    };

    // Mock Firestore functions
    (window as any).getDoc = mocks.getDoc || mockFirestore.getDoc;
    (window as any).updateDoc = mocks.updateDoc || mockFirestore.updateDoc;
    (window as any).setDoc = mocks.setDoc || mockFirestore.setDoc;
    (window as any).deleteDoc = mocks.deleteDoc || mockFirestore.deleteDoc;
    (window as any).doc = mocks.doc || mockFirestore.doc;
    (window as any).db = mocks.db || mockFirestore;

    // Mock User class
    (window as any).User = mocks.User || mockUserClass;

    // Mock ApiService
    (window as any).ApiService = mocks.ApiService || mockApiService;

    // Mock console methods
    (window as any).console = {
      ...console,
      log: () => {},
      error: () => {},
      warn: () => {}
    };
  }, customMocks);
};

// Helper function to mock API routes
export const mockApiRoute = async (page: any, pattern: string, response: any) => {
  await page.route(pattern, async (route: any) => {
    await route.fulfill({
      status: response.status || 200,
      contentType: 'application/json',
      body: JSON.stringify(response.body || {})
    });
  });
};

// Helper function to mock network errors
export const mockNetworkError = async (page: any, pattern: string) => {
  await page.route(pattern, async (route: any) => {
    await route.abort('failed');
  });
};

// Helper function to mock slow responses
export const mockSlowResponse = async (page: any, pattern: string, delay: number, response: any) => {
  await page.route(pattern, async (route: any) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    await route.fulfill({
      status: response.status || 200,
      contentType: 'application/json',
      body: JSON.stringify(response.body || {})
    });
  });
};
