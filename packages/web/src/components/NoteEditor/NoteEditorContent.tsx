import { LinkBubbleMenu, RichTextContent } from 'mui-tiptap';
import type { Editor } from '@tiptap/core';
import type { Tag } from '@/types';
import type { NoteDraft } from './hooks/useNoteForm';
import TagManager from './NoteElements/TagManager';
import { useGenerateTags } from '@/hooks/queries/useTags';

interface NoteEditorContentProps {
  editor: Editor | null;
  tags: Tag[];
  onTagsChange: (tags: (Tag | string)[]) => void;
  draft: NoteDraft;
  isViewingStudentNote: boolean;
}

export default function NoteEditorContent({
  editor,
  tags,
  onTagsChange,
  draft,
  isViewingStudentNote,
}: NoteEditorContentProps) {
  const generateTags = useGenerateTags();

  const fetchSuggestedTags = () => {
    if (!editor) {
      console.error('Editor instance is not available');
      return;
    }
    generateTags.mutate(
      {
        content: editor.getText(),
        title: draft.title,
        locationName: draft.locationName || undefined,
        existingTags: draft.tags.map(t => t.label),
        time: draft.time.toISOString(),
      },
      {
        onError: (error) => {
          console.error('Error generating tags:', error);
        },
      },
    );
  };

  return (
    <>
      <div className='mt-3'>
        <TagManager
          tags={tags}
          suggestedTags={generateTags.data ?? []}
          onTagsChange={onTagsChange}
          fetchSuggestedTags={fetchSuggestedTags}
          onDismissSuggestions={() => generateTags.reset()}
          loading={generateTags.isPending}
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
