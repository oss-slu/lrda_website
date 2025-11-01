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
      
      // Store the token in local storage
      localStorage.setItem("authToken", token);
      // Set cookie with security flags (httpOnly must be set server-side)
      const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
      const secureFlag = isSecure ? "; Secure" : "";
      document.cookie = `authToken=${token}; path=/; SameSite=Strict${secureFlag}`;
  
      const userData = await ApiService.fetchUserData(user.uid);
  
      if (userData) {
        // If user data is found in the API
        this.userData = userData;
        // Removed sensitive data logging for security
      } else {
        // If not found in the API, try fetching from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          this.userData = userDoc.data() as UserData;
          // Removed sensitive data logging for security
        } else {
          console.log("User data not found in Firestore or API.");
        }
      }
  
      // Ensure necessary fields are properly handled
      if (this.userData) {
        // Removed sensitive data logging for security
  
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
      // Clear the cookie with same flags as setting
      const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
      const secureFlag = isSecure ? "; Secure" : "";
      document.cookie = `authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict${secureFlag}`;
      
      console.log("User logged out");
    } catch (error) {
      console.log("User did not successfully log out");
    }
  }

  public async getId(): Promise<string | null> {
    // First try to get UID from Firebase Auth directly
    if (auth && auth.currentUser) {
      return auth.currentUser.uid;
    }
    
    // Load user data if not already loaded
    if (!this.userData) {
      this.userData = await this.loadUser();
    }
    
    // Fallback to stored user data
    if (this.userData && this.userData.uid) {
      return this.userData.uid;
    }
    
    return null;
  }

  public async getName(): Promise<string | null> {
    // Load user data if not already loaded
    if (!this.userData) {
      this.userData = await this.loadUser();
    }
    
    // First try to get name from stored user data
    if (this.userData && this.userData.name) {
      return this.userData.name;
    }
    
    // If we have a UID, try fetching the name using ApiService (checks Firestore, then RERUM)
    const userId = await this.getId();
    if (userId) {
      try {
        const name = await ApiService.fetchCreatorName(userId);
        // Update userData with the fetched name so we don't need to fetch again
        if (this.userData && name && name !== "Unknown User") {
          this.userData.name = name;
          this.persistUser(this.userData);
        }
        return name && name !== "Unknown User" ? name : null;
      } catch (error) {
        console.log("Could not fetch creator name:", error);
      }
    }
    
    // Fallback to Firebase Auth displayName (but not email)
    if (auth && auth.currentUser) {
      return auth.currentUser.displayName || null;
    }
    
    return null;
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
