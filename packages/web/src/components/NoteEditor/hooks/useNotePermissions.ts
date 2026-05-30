import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { hasInstructorAccess } from '@/stores/authHelpers';
import { useShallow } from 'zustand/react/shallow';
import { Note } from '@/types';

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

  return useMemo(() => {
    if (!authUser) {
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

    const userId = authUser.id;
    const isInstr = hasInstructorAccess(authUser);
    const isStudentRole = !isInstr;
    const isStudentInTeacherStudentModel = isStudentRole && !!authUser.instructorId;

    const canCommentValue = isInstr || isStudentInTeacherStudentModel;

    const isViewingStudentNote = !!(isInstr && note?.creator && note.creator !== userId);
    const isStudentViewingOwnNote = !!(
      isStudentInTeacherStudentModel &&
      note?.creator &&
      note.creator === userId
    );

    return {
      userId,
      instructorId: isInstr ? userId : null,
      isStudent: isStudentInTeacherStudentModel,
      isInstructorUser: isInstr,
      isViewingStudentNote,
      isStudentViewingOwnNote,
      canComment: canCommentValue,
    };
  }, [authUser, note?.creator]);
};
