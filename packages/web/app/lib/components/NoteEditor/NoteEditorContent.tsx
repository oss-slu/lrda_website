import { useState } from 'react';
import { LinkBubbleMenu, RichTextContent } from 'mui-tiptap';
import type { Editor } from '@tiptap/core';
import TagManager from './NoteElements/TagManager';
import { tagsService } from '@/app/lib/services';
import { handleTagsChange } from './handlers/noteHandlers';
import type { NoteStateType, NoteHandlersType } from './hooks/useNoteState';

interface NoteEditorContentProps {
  noteState: NoteStateType;
  noteHandlers: NoteHandlersType;
  editor: Editor | null;
  isViewingStudentNote: boolean;
  onEdit: () => void;
}

export default function NoteEditorContent({
  noteState,
  noteHandlers,
  editor,
  isViewingStudentNote,
  onEdit,
}: NoteEditorContentProps) {
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(false);

  const fetchSuggestedTags = async () => {
    setLoadingTags(true);
    try {
      if (editor) {
        const tags = await tagsService.generateTags({
          content: editor.getText(),
          title: noteState.title,
          locationName: noteState.locationName || undefined,
          existingTags: noteState.tags.map(t => t.label),
          time: noteState.time?.toISOString(),
        });
        setSuggestedTags(tags);
      } else {
        console.error('Editor instance is not available');
      }
    } catch (error) {
      console.error('Error generating tags:', error);
    } finally {
      setLoadingTags(false);
    }
  };

  return (
    <>
      <div className='mt-3'>
        <TagManager
          inputTags={noteState.tags}
          suggestedTags={suggestedTags}
          onTagsChange={newTags => {
            onEdit();
            handleTagsChange(noteHandlers.setTags, newTags);
          }}
          fetchSuggestedTags={fetchSuggestedTags}
          onDismissSuggestions={() => setSuggestedTags([])}
          loading={loadingTags}
          disabled={isViewingStudentNote}
        />
      </div>

      <div
        className='mt-4 w-full pb-8 transition-opacity duration-200 ease-in-out'
        onMouseDown={e => {
          if (!editor) return;
          const target = e.target as HTMLElement;
          if (!target.closest('.ProseMirror')) {
            e.preventDefault();
            editor.chain().focus('start').run();
          }
        }}
        onKeyDown={e => {
          if (!editor) return;
          if (e.key === 'ArrowDown' && editor.isEmpty) {
            e.preventDefault();
            editor.chain().focus().insertContent('<p><br/></p>').run();
          }
        }}
      >
        <div className='relative w-full'>
          <RichTextContent className='prose prose-lg min-h-[400px] max-w-none' />
          <LinkBubbleMenu />
        </div>
      </div>
    </>
  );
}
