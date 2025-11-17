"use client";
import React, { useState } from "react";
import Image from "next/image";
import RegisterButton from "../../components/register_button";
import { Input } from "@/components/ui/input";
import PasswordInput from "@/components/ui/password-input";
import StrengthIndicator from "@/components/ui/strength-indicator";
import { toast } from "sonner";
import { auth, db } from "../../config/firebase"; // Ensure you import Firestore as well
import { createUserWithEmailAndPassword } from "firebase/auth";
import { validateEmail, validatePassword, validateFirstName, validateLastName } from "../../utils/validation";
import { User } from "../../models/user_class";
import ApiService from "../../utils/api_service";
import { Timestamp, doc, setDoc } from "firebase/firestore";
import Link from "next/link"; // Import Link for routing
import StrengthIndicator from "@/components/ui/strength-indicator";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [institution, setInstitution] = useState("");
  const [formError, setFormError] = useState("");
  const [unmetRequirements, setUnmetRequirements] = useState<string[]>([]);

  const handleSignup = async () => {
    setFormError("");
    if (!validateEmail(email)) return;
    if (!validatePassword(password)) return;

    if (unmetRequirements.length > 0) {
      setFormError(`Password does not meet requirements: ${unmetRequirements[0]}`);
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    if (!validateFirstName(firstName)) return;
    if (!validateLastName(lastName)) return;

    try {
      // Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Combine firstName and lastName for the name field
      const fullName = `${firstName} ${lastName}`;
  
      // Prepare user data for Firestore
      const userData = {
        uid: user.uid,
        email,
        name: fullName,
        institution,
        roles: {
          administrator: true,
          contributor: true,
        },
        createdAt: Timestamp.now(),
      };
  
      // Store the user data in Firestore under the "users" collection
      await setDoc(doc(db, "users", user.uid), userData);
  
      // Set the user as logged in
      const userInstance = User.getInstance();
      await userInstance.login(email, password);

      // Optional delay to ensure everything is set up
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect the user to the home page
      window.location.href = "/";
    } catch (error) {
      const msg = (error && (error as any).message) || String(error);
      setFormError(`Signup failed: ${msg}`);
      toast.error(`Signup failed: ${msg}`);
    }
  };

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  return (
    <div className="flex flex-col items-center justify-center bg-[#F4DFCD]">
      <div className="flex items-center justify-center">
        <Image
          src="/splash.png"
          alt="Background Image"
          width="2080"
          height="300"
        />
      </div>
      <div className="absolute inset-10 flex flex-col items-center justify-center">
        <div className="w-3/4 bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-black-500 font-bold mb-8 text-center text-3xl">
           User Sign Up
          </h1>
          <div className="mb-4">
            <label htmlFor="first-name-input" className="block text-base sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">First name</label>
            <Input id="first-name-input" type="text" autoComplete="given-name" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="mb-4">
            <label htmlFor="last-name-input" className="block text-base sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">Last name</label>
            <Input id="last-name-input" type="text" autoComplete="family-name" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div className="mb-4">
            <label htmlFor="email-input" className="block text-base sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">Email</label>
            <Input id="email-input" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-4">
            <PasswordInput id="password-input" password={password} onPasswordChange={(v) => setPassword(v)} autoComplete="new-password" required />
            <StrengthIndicator password={password} onUnmet={(errs) => setUnmetRequirements(errs)} />
          </div>
          <div className="mb-4">
            <label htmlFor="confirm-password-input" className="block text-base sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">Confirm Password</label>
            <Input id="confirm-password-input" type="password" autoComplete="new-password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          {formError && (
            <div role="alert" aria-live="assertive" className="text-red-600 mb-3">
              {formError}
            </div>
          )}

          <form onSubmit={async (e) => { e.preventDefault(); setIsSubmitting(true); await handleSignup(); setIsSubmitting(false); }}>
            <div className="flex flex-col sm:flex-row items-center justify-center mt-6">
              <button
                type="submit"
                className={`w-full bg-blue-500 text-white p-3 rounded-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing up...' : 'Sign Up'}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center text-sm">
            <span>Already have an account? </span>
            <Link href="/lib/pages/loginPage" className="text-blue-600 hover:underline">Log in</Link>
          </div>
         

        </div>
      </div>
    </div>
  );
};

export default SignupPage;
