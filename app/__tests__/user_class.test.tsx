import { User } from '../lib/models/user_class';
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import ApiService from '../lib/utils/api_service';

jest.mock('firebase/auth');
jest.mock('../lib/utils/api_service');

jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(), // Mock Realtime Database
}));

describe('User class', () => {
  let user: User;
  const mockUserData = {
    "@id": "mockId123",
    name: "JohnDoe",
    roles: {
      administrator: true,
      contributor: false,
    },
    uid: "mockId123"
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    user = User.getInstance(); // Assuming singleton pattern for user instance

    // Mock the signInWithEmailAndPassword function
    (signInWithEmailAndPassword as jest.Mock).mockImplementation(async () => {
      return {
        user: {
          uid: mockUserData.uid,
          getIdToken: jest.fn().mockResolvedValue('mockToken'),
        },
      };
    });

    // Mock the fetchUserData function
    (ApiService.fetchUserData as jest.Mock).mockImplementation(async () => {
      return mockUserData;
    });
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks
    jest.clearAllTimers(); // Clear all timers
    console.log("All mocks and timers have been cleared");
  });

  describe('login', () => {
    it('logs in the user successfully', async () => {
      await user.login('testUser', 'testPass'); // Ensure this resolves
      const userId = await user.getId();
      expect(userId).toBe(mockUserData.uid);
    });

    it('fails to log in due to server error', async () => {
      const errorMessage = 'There was a server error logging in.';
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(user.login('testUser', 'testPass')).rejects.toThrow(errorMessage);
    });
  });

  describe('logout', () => {
    it('logs out the user successfully', async () => {
      (signOut as jest.Mock).mockResolvedValue(undefined); // Ensure signOut is mocked correctly
      await user.logout();

      const userId = await user.getId();
      expect(userId).toBeNull();
    });
  });

  describe('getId', () => {
    it("retrieves the user's ID successfully", async () => {
      localStorage.setItem('userData', JSON.stringify(mockUserData));
      const userId = await user.getId();
      expect(userId).toBe(mockUserData.uid);
    });
  });

  describe('getName', () => {
    it("retrieves the user's name successfully", async () => {
      localStorage.setItem('userData', JSON.stringify(mockUserData));
      const userName = await user.getName();
      expect(userName).toBe(mockUserData.name);
    });
  });

  describe('getRoles', () => {
    it("retrieves the user's roles successfully", async () => {
      localStorage.setItem('userData', JSON.stringify(mockUserData));
      const userRoles = await user.getRoles();
      expect(userRoles).toEqual(mockUserData.roles);
    });
  });
});