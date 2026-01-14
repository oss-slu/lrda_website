export { default } from './NoteEditor';
export { default as NoteEditor } from './NoteEditor';

// Sub-components
export { default as NoteEditorHeader } from './NoteEditorHeader';
export { default as NoteEditorToolbar } from './NoteEditorToolbar';
export { default as NoteEditorContent } from './NoteEditorContent';
export {
  default as NoteEditorComments,
  CommentSidebarPanel,
  CommentToggleButton,
} from './NoteEditorComments';

// Hooks
export { default as useNoteState } from './hooks/useNoteState';
export type { NoteStateType, NoteHandlersType } from './hooks/useNoteState';
export { useNotePermissions } from './hooks/useNotePermissions';
export { useNoteSync } from './hooks/useNoteSync';
export { useAutoSave } from './hooks/useAutoSave';
export { useCommentBubble } from './hooks/useCommentBubble';
export { useIntroTour } from './hooks/useIntroTour';

// Handlers
export * from './handlers/noteHandlers';

// Utils
export * from './utils/noteHelpers';
