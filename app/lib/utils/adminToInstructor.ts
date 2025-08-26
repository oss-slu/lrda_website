import { doc, updateDoc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface AdminUser {
  createdAt: any;
  email: string;
  name: string;
  roles: {
    administrator: boolean;
    contributor: boolean;
    [key: string]: boolean;
  };
  uid: string;
  isInstructor?: boolean;
  pendingInstructorDescription?: string;
}

export interface InstructorUser {
  createdAt: any;
  description: string | null;
  email: string;
  isInstructor: boolean;
  name: string;
  students: string[];
  uid: string;
}

// New interface for users with only authentication
export interface AuthOnlyUser {
  uid: string;
  email: string;
  name: string;
  // These will be created during application
  createdAt?: any;
  roles?: {
    administrator: boolean;
    contributor: boolean;
    [key: string]: boolean;
  };
  isInstructor?: boolean;
  pendingInstructorDescription?: string;
}

/**
 * Submit an application for an admin to become an instructor
 * @param uid - User ID
 * @param description - Instructor description
 * @param userData - Optional user data (for users with only authentication)
 * @returns Promise<boolean> - Success status
 */
export async function submitInstructorApplication(
  uid: string, 
  description: string,
  userData?: AuthOnlyUser
): Promise<boolean> {
  try {
    // Get current user data
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      // Existing user - update with instructor application
      const adminData = userDoc.data() as AdminUser;
      
      // Verify user is an admin
      if (!adminData.roles?.administrator) {
        throw new Error('User must be an administrator to apply for instructor');
      }

      // Check if user is already an instructor
      if (adminData.isInstructor === true) {
        throw new Error('You are already an instructor');
      }

      // Update the user document to mark as pending instructor application
      await updateDoc(doc(db, 'users', uid), {
        isInstructor: false,  // Initially false, will become true upon approval
        pendingInstructorDescription: description  // Store description temporarily
      });
    } else {
      // New user with only authentication - create document with instructor application
      if (!userData) {
        throw new Error('User data required for new users');
      }

      // Create new user document with instructor application
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: userData.email,
        name: userData.name,
        createdAt: Timestamp.now(),
        roles: {
          administrator: true,  // Assume they have admin privileges if they can access this
          contributor: true
        },
        isInstructor: false,  // Initially false, will become true upon approval
        pendingInstructorDescription: description  // Store description temporarily
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error submitting instructor application:', error);
    throw error;
  }
}

/**
 * Check if a user can apply to become an instructor
 * @param uid - User ID
 * @returns Promise<{canApply: boolean, reason?: string}>
 */
export async function canApplyForInstructor(uid: string): Promise<{
  canApply: boolean;
  reason?: string;
  currentData?: AdminUser | null;
  isNewUser?: boolean;
}> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      // User exists in Firebase Auth but not in Firestore
      // They can apply if they have authentication
      return { 
        canApply: true, 
        reason: 'User has authentication but no profile data',
        currentData: null,
        isNewUser: true
      };
    }

    const userData = userDoc.data() as AdminUser;
    
    // Check if already an instructor
    if (userData.isInstructor === true) {
      return { canApply: false, reason: 'User is already an instructor' };
    }
    
    // Check if there's already a pending application
    if (userData.pendingInstructorDescription) {
      return { canApply: false, reason: 'You already have a pending application' };
    }
    
    // Check if user is an admin
    if (!userData.roles?.administrator) {
      return { canApply: false, reason: 'Only administrators can apply to become instructors' };
    }

    return { 
      canApply: true, 
      currentData: userData,
      isNewUser: false
    };
  } catch (error) {
    console.error('Error checking instructor eligibility:', error);
    return { canApply: false, reason: 'Error checking eligibility' };
  }
}

/**
 * Get the difference between admin and instructor models
 * @returns Object showing what fields need to be added
 */
export function getInstructorFieldRequirements() {
  return {
    requiredFields: [
      'description',
      'isInstructor',
      'students'
    ],
    optionalFields: [
      'parentInstructorId'
    ],
    preservedFields: [
      'createdAt',
      'email', 
      'name',
      'uid',
      'roles'
    ]
  };
}

/**
 * Approve an instructor application and convert the user
 * @param userUid - UID of the user to approve
 * @param adminUid - UID of the admin user
 * @param adminName - Name of the admin user
 * @returns Promise<boolean> - Success status
 */
export async function approveInstructorApplication(
  userUid: string,
  adminUid: string,
  adminName: string
): Promise<boolean> {
  try {
    // Get the user data
    const userDoc = await getDoc(doc(db, 'users', userUid));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    if (userData.isInstructor === true) {
      throw new Error('User is already an instructor');
    }
    
    if (!userData.pendingInstructorDescription) {
      throw new Error('No pending instructor application found');
    }
    
    // Transform the user to instructor structure (exactly as you specified)
    await updateDoc(doc(db, 'users', userUid), {
      // Set instructor fields
      isInstructor: true,
      description: userData.pendingInstructorDescription,
      students: []
    });
    
    // Remove the temporary pending field
    await updateDoc(doc(db, 'users', userUid), {
      pendingInstructorDescription: null
    });
    
    return true;
  } catch (error) {
    console.error('Error approving instructor application:', error);
    throw error;
  }
}

/**
 * Reject an instructor application
 * @param userUid - UID of the user to reject
 * @param adminUid - UID of the admin user
 * @param reason - Reason for rejection
 * @returns Promise<boolean> - Success status
 */
export async function rejectInstructorApplication(
  userUid: string,
  adminUid: string,
  reason: string
): Promise<boolean> {
  try {
    // Get the user data
    const userDoc = await getDoc(doc(db, 'users', userUid));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    // Just remove the pending description and keep isInstructor: false
    await updateDoc(doc(db, 'users', userUid), {
      pendingInstructorDescription: null
    });
    
    return true;
  } catch (error) {
    console.error('Error rejecting instructor application:', error);
    throw error;
  }
}
