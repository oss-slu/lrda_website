import { UserData } from "../../types";
import { getItem, setItem } from "../utils/async_storage";
import { auth, db } from "../config/firebase"; // Import Firestore database
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import ApiService from '../utils/api_service';
import { doc, getDoc,setDoc } from "firebase/firestore"; // Firestore imports



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
        // First, try to fetch user data from the API
        const userData = await ApiService.fetchUserData(user.uid);
        
        if (userData) {
          // If found in the API, set user data and persist it
          this.userData = userData;
          this.persistUser(userData);
        } else {
          // If not found in the API, try Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            this.userData = userDoc.data() as UserData;
            this.persistUser(this.userData);
          } else {
            console.log("User not found in API or Firestore.");
          }
        }
        this.notifyLoginState();
      } else {
        // User is signed out
        this.userData = null;
        this.clearUser();
        this.notifyLoginState();
      }
    });
  }

  public async acceptAgreement(uid: string): Promise<void> {
    try {
      // Update Firestore to reflect agreement acceptance
      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, { agreementAccepted: true }, { merge: true });
      console.log("User agreement status updated successfully.");
  
      // Optionally, update local user data
      if (this.userData) {
        this.userData.agreementAccepted = true; // No more TypeScript error
        this.persistUser(this.userData);
      }
    } catch (error) {
      console.error("Failed to update user agreement status:", error);
      throw error;
    }
  }
  
  

  public async login(email: string, password: string): Promise<string> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      const token = await user.getIdToken();
      localStorage.setItem("authToken", token);
  
      const userData = await ApiService.fetchUserData(user.uid);
  
      if (userData) {
        this.userData = userData;
        this.persistUser(userData);
      } else {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          this.userData = userDoc.data() as UserData;
          this.persistUser(this.userData);
        } else {
          console.log("No user data found in Firestore or API.");
          this.userData = null;
        }
      }
  
      return "success";
    } catch (error) {
      console.error("Login error:", error);
      throw error;
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
    try {
      // Load userData from storage if not already set
      if (!this.userData) {
        console.log("No userData found, loading from storage...");
        this.userData = await this.loadUser();
      }
  
      // Debugging log to check userData
      console.log("Current userData in getName:", this.userData);
  
      // Return name if available
      if (this.userData?.name) {
        console.log("Retrieved name from userData:", this.userData.name);
        return this.userData.name;
      }
  
      // Fallback to Firebase auth displayName or email
      const currentUser = auth.currentUser;
      if (currentUser?.displayName) {
        console.log("Retrieved name from Firebase auth:", currentUser.displayName);
        return currentUser.displayName;
      }
      if (currentUser?.email) {
        console.log("Using email as fallback:", currentUser.email);
        return currentUser.email;
      }
  
      console.log("No name found in userData or Firebase auth.");
      return null;
    } catch (error) {
      console.error("Error in getName:", error);
      return null;
    }
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
