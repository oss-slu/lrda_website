import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import { Trash2, GripVertical, FileAudio } from 'lucide-react';

function AudioNodeView({ node, deleteNode, selected, editor }: ReactNodeViewProps) {
  const isEditable = editor.isEditable;

  return (
    <NodeViewWrapper data-drag-handle className="my-4">
      <div
        className={`group relative flex items-center gap-3 rounded-lg border bg-gray-50 p-3 ${
          selected ? 'ring-2 ring-blue-500 ring-offset-2' : 'border-gray-200'
        }`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <FileAudio className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          {node.attrs.title && (
            <p className="mb-1 truncate text-sm font-medium text-gray-700">
              {node.attrs.title}
            </p>
          )}
          <audio controls src={node.attrs.src} className="h-8 w-full" preload="metadata" />
        </div>
        {isEditable && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="cursor-grab rounded bg-black/60 p-1.5 text-white hover:bg-black/80" data-drag-handle>
              <GripVertical className="h-4 w-4" />
            </div>
            <button
              type="button"
              onClick={deleteNode}
              className="rounded bg-black/60 p-1.5 text-white hover:bg-red-600"
              title="Remove audio"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

declare module '@tiptap/core' {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Tiptap's interface uses this name
  interface Commands<ReturnType> {
    audio: {
      setAudio: (options: { src: string; title?: string }) => ReturnType;
    };
  }
}

export const AudioNode = Node.create({
  name: 'audio',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'audio',
        getAttrs: (el) => {
          const element = el as HTMLAudioElement;
          const src =
            element.getAttribute('src') ||
            element.querySelector('source')?.getAttribute('src');
          // Title is stored in the Tiptap JSON doc, not in the HTML output
          return src ? { src } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Strip title from HTML output -- it's only used in the editor node view
    const { title: _title, ...rest } = HTMLAttributes;
    return [
      'audio',
      mergeAttributes(rest, {
        controls: 'true',
        preload: 'metadata',
        style: 'width: 100%;',
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioNodeView);
  },

  addCommands() {
    return {
      setAudio:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
