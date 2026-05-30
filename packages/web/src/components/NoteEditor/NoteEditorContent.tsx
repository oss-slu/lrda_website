import { useState } from 'react';
import { LinkBubbleMenu, RichTextContent } from 'mui-tiptap';
import type { Editor } from '@tiptap/core';
import { useNoteEditorStore } from '@/stores/noteEditorStore';
import TagManager from './NoteElements/TagManager';
import { tagsService } from '@/services';

interface NoteEditorContentProps {
  editor: Editor | null;
  isViewingStudentNote: boolean;
}

export default function NoteEditorContent({
  editor,
  isViewingStudentNote,
}: NoteEditorContentProps) {
  const tags = useNoteEditorStore(s => s.tags);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  const fetchSuggestedTags = async () => {
    if (!editor) {
      console.error('Editor instance is not available');
      return;
    }
    setLoadingTags(true);
    try {
      const s = useNoteEditorStore.getState();
      const result = await tagsService.generateTags({
        content: editor.getText(),
        title: s.title,
        locationName: s.locationName || undefined,
        existingTags: s.tags.map(t => t.label),
        time: s.time?.toISOString(),
      });
      setSuggestedTags(result);
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
          inputTags={tags}
          suggestedTags={suggestedTags}
          onTagsChange={newTags => {
            const store = useNoteEditorStore.getState();
            store.setTags(newTags);
            store.markEdited();
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
