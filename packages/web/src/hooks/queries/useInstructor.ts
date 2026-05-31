import { useQuery, queryOptions } from '@tanstack/react-query';
import { fetchStudents } from '@/services/instructor.service';
import type { StudentInfo } from '@/services/instructor.service';

export function studentsOptions(instructorId: string) {
  return queryOptions({
    queryKey: ['instructor', 'students', instructorId],
    queryFn: (): Promise<StudentInfo[]> => fetchStudents(instructorId),
  });
}

export function useStudents(instructorId: string | null, enabled = true) {
  return useQuery({
    ...studentsOptions(instructorId ?? ''),
    enabled: !!instructorId && enabled,
  });
}
