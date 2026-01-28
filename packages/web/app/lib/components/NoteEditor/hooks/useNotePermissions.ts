import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/app/lib/stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { fetchUserById } from '@/app/lib/services';
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

  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [isInstructorUser, setIsInstructorUser] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [canComment, setCanComment] = useState<boolean>(false);

  const isViewingStudentNote = useMemo(() => {
    const result = !!(isInstructorUser && userId && note?.creator && note.creator !== userId);
    console.log('isViewingStudentNote calculation:', {
      isInstructorUser,
      userId,
      noteCreator: note?.creator,
      result,
    });
    return result;
  }, [isInstructorUser, userId, note?.creator]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- note?.creator is the correct minimal dependency
  const isStudentViewingOwnNote = useMemo(() => {
    const result = !!(isStudent && userId && note?.creator && note.creator === userId);
    console.log('isStudentViewingOwnNote calculation:', {
      isStudent,
      userId,
      noteCreator: note?.creator,
      result,
    });
    return result;
  }, [isStudent, userId, note?.creator]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      console.log('fetchUserDetails: Starting...');
      const roles = authUser?.roles;
      const fetchedUserId = authUser?.uid;
      console.log('fetchUserDetails: Got userId and roles', { fetchedUserId, roles });

      if (!fetchedUserId) {
        console.log('fetchUserDetails: No userId, returning early');
        return;
      }

      let userData = null;
      try {
        userData = await fetchUserById(fetchedUserId);
        console.log('fetchUserDetails: Fetched userData', userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }

      const isInstr = !!roles?.administrator || !!userData?.isInstructor;
      setIsInstructorUser(isInstr);
      const isStudentRole = !!roles?.contributor && !roles?.administrator;

      let isStudentInTeacherStudentModel = false;
      if (isStudentRole && userData) {
        isStudentInTeacherStudentModel = !!userData?.parentInstructorId;
      }

      setIsStudent(isStudentInTeacherStudentModel);
      setUserId(fetchedUserId);
      setInstructorId(isInstr ? fetchedUserId : null);

      const canCommentValue =
        !!fetchedUserId &&
        (!!roles?.administrator || !!userData?.isInstructor || isStudentInTeacherStudentModel);
      setCanComment(canCommentValue);

      console.log('Comment button debug:', {
        fetchedUserId,
        roles: roles,
        userData: userData,
        isInstr,
        isStudentInTeacherStudentModel,
        canComment: canCommentValue,
        noteId: note?.id,
        isAdministrator: !!roles?.administrator,
        hasIsInstructorFlag: !!userData?.isInstructor,
        noteCreator: note?.creator,
      });
    };
    fetchUserDetails();
  }, [authUser, note?.id, note?.creator]);

  return {
    userId,
    instructorId,
    isStudent,
    isInstructorUser,
    isViewingStudentNote,
    isStudentViewingOwnNote,
    canComment,
  };
};
