import { User } from '../lib/models/user_class';
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import ApiService from '../lib/utils/api_service';

jest.mock('firebase/auth');
jest.mock('../lib/utils/api_service');

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
    jest.resetAllMocks();
    user = User.getInstance(); // Assuming singleton pattern for user instance
  });

  describe('login', () => {
    it('logs in the user successfully', async () => {
      const mockUserCredential = {
        user: { uid: mockUserData.uid }
      };

      signInWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      ApiService.fetchUserData.mockResolvedValue(mockUserData);

      await user.login('testUser', 'testPass');
      const userId = await user.getId();
      expect(userId).toBe(mockUserData.uid);
    });

    it('fails to log in due to server error', async () => {
      const errorMessage = 'There was a server error logging in.';
      signInWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));

      try {
        await user.login('testUser', 'testPass');
      } catch (error) {
        expect(error.message).toBe(errorMessage);
      }
    });
  });

  describe('logout', () => {
    it('logs out the user successfully', async () => {
      signOut.mockResolvedValue();
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
