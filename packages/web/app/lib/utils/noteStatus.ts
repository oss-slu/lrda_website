import type { Note } from '@/app/types';

export type NoteStatus = 'published' | 'pending' | 'returned' | 'draft';

export function getNoteStatus(note: Note): NoteStatus {
  if (note.published) return 'published';
  if (note.isReturned) return 'returned';
  if (note.approvalRequested) return 'pending';
  return 'draft';
}

export const statusConfig: Record<NoteStatus, { label: string; className: string }> = {
  published: { label: 'Published', className: 'bg-green-100 text-green-700 border-transparent' },
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 border-transparent' },
  returned: { label: 'Returned', className: 'bg-orange-100 text-orange-700 border-transparent' },
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600 border-transparent' },
};

export function isUnreviewed(note: Note): boolean {
  return !!note.approvalRequested && !note.published && !note.isReturned;
}

export function isReviewed(note: Note): boolean {
  return !!note.published || !!note.isReturned;
}
