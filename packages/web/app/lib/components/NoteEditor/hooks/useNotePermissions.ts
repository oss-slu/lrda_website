import { useMemo } from 'react';
import { useAuthStore } from '@/app/lib/stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { Note } from '@/app/types';

interface UseNotePermissionsResult {
  userId: string | null;
  instructorId: string | null;
  isStudent: boolean;
  isInstructorUser: boolean;
  isViewingStudentNote: boolean;
  isStudentViewingOwnNote: boolean;
  canComment: boolean;
}

export const useNotePermissions = (note: Note | undefined): UseNotePermissionsResult => {
  const { user: authUser } = useAuthStore(
    useShallow(state => ({
      user: state.user,
    })),
  );

  // Derive all permissions synchronously from auth store data.
  // Previously this hook made an async fetchUserById call which was both
  // redundant (auth store already has the data) and fragile (fails on
  // refresh before the session cookie is re-validated by the API).
  return useMemo(() => {
    const uid = authUser?.uid ?? null;
    const roles = authUser?.roles;

    if (!uid) {
      return {
        userId: null,
        instructorId: null,
        isStudent: false,
        isInstructorUser: false,
        isViewingStudentNote: false,
        isStudentViewingOwnNote: false,
        canComment: false,
      };
    }

    const isInstr = !!roles?.administrator || !!authUser?.isInstructor;

    const isStudentRole = !!roles?.contributor && !roles?.administrator;
    const isStudentInTeacherStudentModel =
      isStudentRole && !!authUser?.parentInstructorId;

    const canCommentValue =
      !!roles?.administrator || !!authUser?.isInstructor || isStudentInTeacherStudentModel;

    const isViewingStudentNote = !!(isInstr && note?.creator && note.creator !== uid);
    const isStudentViewingOwnNote = !!(
      isStudentInTeacherStudentModel &&
      note?.creator &&
      note.creator === uid
    );

    return {
      userId: uid,
      instructorId: isInstr ? uid : null,
      isStudent: isStudentInTeacherStudentModel,
      isInstructorUser: isInstr,
      isViewingStudentNote,
      isStudentViewingOwnNote,
      canComment: canCommentValue,
    };
  }, [authUser, note?.creator]);
};
