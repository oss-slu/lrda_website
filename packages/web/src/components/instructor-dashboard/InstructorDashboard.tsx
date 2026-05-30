import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';
import type { Note } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useNotesStore } from '@/stores/notesStore';
import { hasInstructorAccess } from '@/stores/authHelpers';
import { useStudentNotes, notesKeys } from '@/hooks/queries/useNotes';
import { notesService, fetchStudents, commentsService } from '@/services';
import { isUnreviewed } from '@/utils/noteStatus';
import { InstructorSidebar } from '@/components/instructor-dashboard/InstructorSidebar';
import NoteEditor from '@/components/NoteEditor';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function InstructorDashboard() {
  const queryClient = useQueryClient();

  const { user, isInitialized } = useAuthStore(
    useShallow(state => ({ user: state.user, isInitialized: state.isInitialized })),
  );
  const { selectedNoteId, setSelectedNoteId } = useNotesStore(
    useShallow(state => ({
      selectedNoteId: state.selectedNoteId,
      setSelectedNoteId: state.setSelectedNoteId,
    })),
  );

  const isInstructor = hasInstructorAccess(user);
  const instructorId = isInitialized && isInstructor ? (user?.id ?? null) : null;

  const { data: studentNotes = [] } = useStudentNotes(instructorId, isInstructor);

  const { data: students = [] } = useQuery({
    queryKey: ['instructor-students', user?.id],
    queryFn: () => fetchStudents(user!.id),
    enabled: !!user?.id && isInstructor && isInitialized,
  });

  // Derive selectedNote from live query data so polling keeps it fresh
  const selectedNote = useMemo(
    () => studentNotes.find(n => n.id === selectedNoteId) ?? undefined,
    [studentNotes, selectedNoteId],
  );

  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  const [declineFeedback, setDeclineFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNoteSelect = (note: Note) => {
    setSelectedNoteId(note.id);
  };

  const handleApprove = async () => {
    if (!selectedNote) return;
    setIsSubmitting(true);
    try {
      await notesService.update({
        ...selectedNote,
        published: true,
        approvalRequested: false,
        isReturned: false,
      });
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
      setSelectedNoteId(null);
      toast('Note Approved', {
        description: 'The note has been published successfully.',
        duration: 4000,
      });
    } catch {
      toast('Error', {
        description: 'Failed to approve note. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeclineConfirm = async () => {
    if (!selectedNote) return;
    setIsSubmitting(true);
    try {
      if (declineFeedback.trim()) {
        await commentsService.create({
          id: '',
          noteId: selectedNote.id,
          text: declineFeedback.trim(),
          authorId: user?.id ?? '',
          authorName: user?.name ?? '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          threadId: null,
          parentId: null,
        });
      }
      await notesService.update({
        ...selectedNote,
        published: false,
        approvalRequested: false,
        isReturned: true,
      });
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
      setIsDeclineDialogOpen(false);
      setDeclineFeedback('');
      setSelectedNoteId(null);
      toast('Note Returned', {
        description: 'The note has been returned to the student for revision.',
        duration: 4000,
      });
    } catch {
      toast('Error', {
        description: 'Failed to return note. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while auth initializes
  if (!isInitialized) {
    return (
      <div className='flex h-full'>
        <div className='flex w-[380px] shrink-0 flex-col gap-4 border-r border-gray-200 bg-gray-50 p-4'>
          <Skeleton className='h-10 w-full rounded-full' />
          <Skeleton className='h-10 w-full rounded-md' />
          <Skeleton className='h-9 w-full rounded-md' />
          <div className='mt-4 flex flex-col gap-2'>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className='h-20 w-full rounded-xl' />
            ))}
          </div>
        </div>
        <div className='flex flex-1 items-center justify-center bg-gray-100'>
          <Skeleton className='h-8 w-48 rounded-md' />
        </div>
      </div>
    );
  }

  // Access denied for non-instructors
  if (!isInstructor) {
    return (
      <div className='flex h-full w-full items-center justify-center bg-gray-100'>
        <div className='flex max-w-md flex-col items-center rounded-sm bg-white px-12 py-16 text-center shadow-sm'>
          <h2 className='mb-2 text-2xl font-semibold text-gray-800'>Access Denied</h2>
          <p className='text-sm text-gray-500'>This page is only available to instructors.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full'>
      <InstructorSidebar notes={studentNotes} students={students} onNoteSelect={handleNoteSelect} />

      <div className='relative flex min-w-0 flex-1 flex-col'>
        {selectedNote && isUnreviewed(selectedNote) && (
          <div className='flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3'>
            <span className='text-sm font-medium text-gray-700'>
              Reviewing:{' '}
              <span className='font-semibold text-gray-900'>
                {selectedNote.title || 'Untitled'}
              </span>
            </span>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                onClick={() => setIsDeclineDialogOpen(true)}
                disabled={isSubmitting}
              >
                <XCircle className='mr-1.5 h-4 w-4' />
                Decline
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
                className='bg-blue-600 text-white hover:bg-blue-700'
              >
                <CheckCircle className='mr-1.5 h-4 w-4' />
                {isSubmitting ? 'Approving...' : 'Approve'}
              </Button>
            </div>
          </div>
        )}

        {selectedNote ?
          <NoteEditor key={selectedNote.id} note={selectedNote} isNewNote={false} />
        : <div className='flex h-full w-full items-center justify-center bg-gray-100'>
            <div className='flex max-w-md flex-col items-center rounded-sm bg-white px-12 py-16 text-center shadow-sm'>
              <h2 className='mb-2 text-2xl font-semibold text-gray-800'>No note selected</h2>
              <p className='text-sm text-gray-500'>
                Select a student note from the sidebar to begin reviewing.
              </p>
            </div>
          </div>
        }
      </div>

      <Dialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Submission</DialogTitle>
            <DialogDescription>
              Optionally provide feedback for the student. The note will be returned for revision.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder='Optional feedback for the student...'
            value={declineFeedback}
            onChange={e => setDeclineFeedback(e.target.value)}
            className='min-h-[100px]'
          />
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDeclineDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDeclineConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Returning...' : 'Return to Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
