import { UserData } from "../../types";
import { getItem, setItem } from "../utils/async_storage";
const RERUM_PREFIX = process.env.NEXT_PUBLIC_RERUM_PREFIX;

export class User {
  private static instance: User;
  private userData: UserData | null = null;
  private callback: ((isLoggedIn: boolean) => void) | null = null;

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

  public async login(username: string, password: string): Promise<string> {
    try {
      const response = await fetch(RERUM_PREFIX + "login", {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        this.userData = data;
        if (this.userData !== null) {
          await this.persistUser(this.userData);
        }
        this.notifyLoginState();
        return "success";
      } else {
        throw new Error("There was a server error logging in.");
      }
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }

  public async logout() {
    try {
      await fetch(RERUM_PREFIX + "logout", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain",
        },
      })
        .then((response) => {
          if (response.ok) {
            this.userData = null;
            this.clearUser();
            this.notifyLoginState();
            console.log("User logged out");
          }
        })
        .catch((err) => {
          return err;
        });
    } catch (error) {
      console.log("User did not succesfully log out");
    }
  }

  public async getId(): Promise<string | null> {
    if (!this.userData) {
      this.userData = await this.loadUser();
    }
    return this.userData?.["@id"] ?? null;
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
