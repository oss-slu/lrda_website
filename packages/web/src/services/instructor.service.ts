import { fetchWithAuth } from './api';

export interface StudentInfo {
  id: string;
  name: string;
  email: string;
}

export async function fetchStudents(instructorId: string): Promise<StudentInfo[]> {
  try {
    const students = await fetchWithAuth<
      Array<{
        id: string;
        name: string;
        email: string;
      }>
    >(`/api/users/${instructorId}/students`);

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
