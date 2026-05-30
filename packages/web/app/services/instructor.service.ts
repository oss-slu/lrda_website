/**
 * Instructor Service
 *
 * Handles instructor-specific operations including student management.
 */

import type { StudentInfo } from './instructor.types';
import { fetchWithAuth } from './api';

/**
 * Fetch all students assigned to an instructor.
 */
export async function fetchStudents(instructorId: string): Promise<StudentInfo[]> {
  try {
    const students = await fetchWithAuth<
      Array<{
        id: string;
        name: string;
        email: string;
      }>
    >(`/api/users/${instructorId}/students`);

    // Map API response to StudentInfo format
    return students.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
    }));
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
}
