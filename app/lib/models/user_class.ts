import { UserData } from "../../types";
import { getItem, setItem } from "../utils/async_storage";
import { auth } from "../config"; // Adjust the path as necessary
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import ApiService from '../utils/api_service';

export class User {
  private static instance: User;
  private userData: UserData | null = null;
  private callback: ((isLoggedIn: boolean) => void) | null = null;

  private constructor() {
    this.initializeUser();
  }

  public static getInstance(): User {
    if (!User.instance) {
      User.instance = new User();
    }
    return User.instance;
  }

  private persistUser(userData: UserData) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("userData", JSON.stringify(userData));
      } catch (error) {
        console.log(error);
      }
    }
  }

  public setLoginCallback(callback: (isLoggedIn: boolean) => void) {
    this.callback = callback;
  }

  private notifyLoginState() {
    if (this.callback) {
      this.callback(this.userData !== null);
    }
  }

  private async loadUser(): Promise<UserData | null> {
    if (typeof window !== "undefined") {
      try {
        const value = await localStorage.getItem("userData");
        if (value !== null) {
          return JSON.parse(value);
        }
      } catch (error) {
        console.log(error);
      }
    }
    return null;
  }

  private async clearUser() {
    if (typeof window !== "undefined") {
      try {
        await localStorage.removeItem("userData");
      } catch (error) {
        console.log(error);
      }
    }
  }

  private async initializeUser() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in.
        const userData = await ApiService.fetchUserData(user.uid);
        if (userData) {
          this.userData = userData;
          this.persistUser(userData);
        }
        this.notifyLoginState();
      } else {
        // User is signed out.
        this.userData = null;
        this.clearUser();
        this.notifyLoginState();
      }
    });
  }

  public async login(email: string, password: string): Promise<string> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();
      console.log(`Login token: ${token}`);
      
      // Store the token in local storage
      localStorage.setItem('authToken', token);
      // Set the token as a cookie
      document.cookie = `authToken=${token}; path=/`;
  
      const userData = await ApiService.fetchUserData(user.uid);
      if (userData) {
        this.userData = userData;
        await this.persistUser(userData);
      }
      this.notifyLoginState();
      return "success";
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }
  
  public async logout() {
    try {
      await signOut(auth);
      this.userData = null;
      this.clearUser();
      this.notifyLoginState();
      
      // Remove the token from local storage
      localStorage.removeItem('authToken');
      // Clear the cookie
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      console.log("User logged out");
    } catch (error) {
      console.log("User did not successfully log out");
    }
  }

  public async getId(): Promise<string | null> {
    if (!this.userData) {
      this.userData = await this.loadUser();
    }
    return this.userData?.["uid"] ?? null;
  }

  public async getName(): Promise<string | null> {
    if (!this.userData) {
      this.userData = await this.loadUser();
    }
    return this.userData?.name ?? null;
  }

  public async hasOnboarded(): Promise<boolean> {
    const onboarded = await getItem("onboarded");
    return onboarded === "1";
  }

  public async getRoles(): Promise<{
    administrator: boolean;
    contributor: boolean;
  } | null> {
    if (!this.userData) {
      this.userData = await this.loadUser();
    }
    return this.userData?.roles ?? null;
  }
}
