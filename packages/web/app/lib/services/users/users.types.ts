/**
 * Type definitions for the Users service.
 */

/**
 * User roles in the system.
 */
export interface UserRoles {
  administrator: boolean;
  contributor: boolean;
}

/**
 * Core user data structure.
 * Note: This type aligns with app/types.ts UserData
 */
export interface UserData {
  uid: string;
  name: string;
  email?: string;
  roles: UserRoles;
  isInstructor?: boolean;
  students?: string[];
  parentInstructorId?: string;
}

/**
 * Options for creating a new user.
 */
export interface CreateUserOptions {
  uid: string;
  name: string;
  email?: string;
  isInstructor?: boolean;
  parentInstructorId?: string;
}

/**
 * Response from RERUM for user/agent queries.
 */
export interface RerumAgentData {
  '@id': string;
  '@type': string;
  uid: string;
  name?: string;
  displayName?: string;
  email?: string;
  roles?: UserRoles;
  isInstructor?: boolean;
  students?: string[];
  parentInstructorId?: string;
}
