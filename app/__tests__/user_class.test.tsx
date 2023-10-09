import { User } from '../lib/models/user_class';

describe('User class', () => {
  let user: User;
  const mockUserData = {
    "@id": "mockId123",
    name: "JohnDoe",
    roles: {
      administrator: true,
      contributor: false,
    }
  };

  beforeEach(() => {
    localStorage.clear();
    jest.resetAllMocks();
    user = User.getInstance(); // Assuming singleton pattern for user instance
  });

  describe('login', () => {
    it('logs in the user successfully', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUserData),
        })
      );

      await user.login('testUser', 'testPass');
      const userId = await user.getId();
      expect(userId).toBe(mockUserData['@id']);
    });

    it('fails to log in due to server error', async () => {
      global.fetch = jest.fn(() => Promise.resolve({ ok: false }));

      try {
        await user.login('testUser', 'testPass');
      } catch (error) {
        expect(error.message).toBe('There was a server error logging in.');
      }
    });
  });

  describe('logout', () => {
    it('logs out the user successfully', async () => {
      global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
      await user.logout();

      const userId = await user.getId();
      expect(userId).toBeNull();
    });
  });

  describe('getId', () => {
    it("retrieves the user's ID successfully", async () => {
      localStorage.setItem('userData', JSON.stringify(mockUserData));
      const userId = await user.getId();
      expect(userId).toBe(mockUserData['@id']);
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
