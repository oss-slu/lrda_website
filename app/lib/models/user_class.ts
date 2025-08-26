import { UserData } from "../../types";
import { getItem, setItem } from "../utils/async_storage";
import { auth, db } from "../config/firebase"; // Import Firestore database
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import ApiService from '../utils/api_service';
import { doc, getDoc } from "firebase/firestore"; // Firestore imports

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
        const userData = await ApiService.fetchUserData(user.uid);
  
        if (userData) {
          this.userData = userData;
          this.persistUser(userData);
        } else {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            this.userData = userDoc.data() as UserData;
            this.persistUser(this.userData);
          }
        }
  
        // Log instructor or student relationship for debugging
        console.log("isInstructor:", this.userData?.isInstructor);
        console.log("parentInstructorId:", this.userData?.parentInstructorId);
  
        this.notifyLoginState();
      } else {
        this.userData = null;
        this.clearUser();
        this.notifyLoginState();
      }
    });
  }

  public async isInstructor(): Promise<boolean> {
    if (!this.userData) {
      this.userData = await this.loadUser();
    }
    return this.userData?.isInstructor || false;
  }

  public getInstructorId(): string | null {
    if (!this.userData) {
      console.warn("User data is not loaded yet.");
      return null;
    }
    return this.userData.parentInstructorId || null;
  }
  
  
  
  public async getParentInstructorId(): Promise<string | null> {
    if (!this.userData) {
      this.userData = await this.loadUser();
    }
    return this.userData?.parentInstructorId || null;
  }
  


  public async login(email: string, password: string): Promise<string> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Fetch the user's token
      const token = await user.getIdToken();
      console.log(`Login token: ${token}`);
      
      // Store the token in local storage
      localStorage.setItem("authToken", token);
      document.cookie = `authToken=${token}; path=/`;
  
      const userData = await ApiService.fetchUserData(user.uid);
  
      if (userData) {
        // If user data is found in the API
        this.userData = userData;
        console.log("User data found in API:", userData);
      } else {
        // If not found in the API, try fetching from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          this.userData = userDoc.data() as UserData;
          console.log("User data found in Firestore:", this.userData);
        } else {
          console.log("User data not found in Firestore or API.");
        }
      }
  
      // Ensure necessary fields are properly handled
      if (this.userData) {
        console.log("isInstructor:", this.userData.isInstructor);
        console.log("parentInstructorId:", this.userData.parentInstructorId);
  
        // Persist user data and update login state
        await this.persistUser(this.userData);
        this.notifyLoginState();
      }
  
      return "success";
    } catch (error) {
      console.error("Login error: ", error);
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
    // First try to get UID from Firebase Auth directly
    if (auth.currentUser) {
      return auth.currentUser.uid;
    }
    
    // Fallback to user data if available
    if (!this.userData) {
      this.userData = await this.loadUser();
    }
    return this.userData?.["uid"] ?? null;
  }

  public async getName(): Promise<string | null> {
    // First try to get name from Firebase Auth directly
    if (auth.currentUser) {
      return auth.currentUser.displayName || auth.currentUser.email;
    }
    
    // Fallback to user data if available
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
    
    // If we still don't have userData, the user has only authentication
    if (!this.userData) {
      console.log('🔍 User.getRoles() - No userData, user has only auth - returning default roles');
      // For users with only authentication, assume they can apply for instructor
      return {
        administrator: true,
        contributor: true
      };
    }
    
    return this.userData?.roles ?? null;
  }
}
