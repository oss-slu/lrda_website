import type { UserProfile } from '@/types';
import { fetchWithAuth } from './api';

export type { PublicUser, UserDetail } from '@lrda/shared';

export interface UpdateProfileOptions {
  name?: string;
  image?: string | null;
  isInstructor?: boolean;
  pendingInstructorDescription?: string | null;
}

export interface InstructorInfo {
  id: string;
  name: string;
  image?: string | null;
  createdAt: string;
}

export async function fetchMe(): Promise<UserProfile | null> {
  try {
    return await fetchWithAuth<UserProfile>('/api/users/me');
  } catch (error) {
    console.warn('Failed to fetch current user:', error);
    return null;
  }
}

async function fetchProfileById(id: string): Promise<UserProfile | null> {
  try {
    return await fetchWithAuth<UserProfile>(`/api/users/${id}`);
  } catch (error) {
    console.warn('Failed to fetch user profile:', error);
    return null;
  }
}

export async function fetchInstructors(search?: string): Promise<InstructorInfo[]> {
  try {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return await fetchWithAuth<InstructorInfo[]>(`/api/users/instructors${params}`);
  } catch (error) {
    console.warn('Failed to fetch instructors:', error);
    return [];
  }
}

export async function fetchCreatorName(creatorId: string): Promise<string> {
  try {
    const profile = await fetchProfileById(creatorId);
    if (profile) {
      return profile.name || profile.email || 'Unknown creator';
    }
    return 'Unknown creator';
  } catch (error) {
    console.warn(`Error fetching creator name for ${creatorId}:`, error);
    return 'Unknown creator';
  }
}
