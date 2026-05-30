import { useCallback, useRef, useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import { Trash2, GripVertical } from 'lucide-react';

function VideoNodeView({ node, updateAttributes, deleteNode, selected, editor }: ReactNodeViewProps) {
  const isEditable = editor.isEditable;
  const containerRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);

  const width = (node.attrs.width as number) || 100;

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const container = containerRef.current;
      if (!container) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startRect = container.getBoundingClientRect();
      const parentWidth = container.parentElement?.getBoundingClientRect().width ?? startRect.width;
      const aspectRatio = startRect.width / startRect.height;

      setResizing(true);

      const onMouseMove = (moveEvent: MouseEvent) => {
        // Use whichever axis moved more to drive the resize
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy * aspectRatio;

        const newPx = Math.max(160, startRect.width + delta);
        const newPct = Math.round(Math.min(100, (newPx / parentWidth) * 100));
        updateAttributes({ width: newPct });
      };

      const onMouseUp = () => {
        setResizing(false);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [updateAttributes],
  );

  return (
    <NodeViewWrapper className="my-4">
      <div
        ref={containerRef}
        style={{ width: `${width}%` }}
        className={`group/video relative overflow-hidden rounded-lg ${
          selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
        } ${resizing ? 'select-none' : ''}`}
      >
        {/* Video element -- pointer-events disabled while resizing */}
        <video
          controls={!resizing}
          src={node.attrs.src as string}
          className={`w-full rounded-lg ${resizing ? 'pointer-events-none' : ''}`}
          preload="metadata"
        />

        {isEditable && (
          <>
            {/* Top-right controls */}
            <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover/video:opacity-100">
              <div
                className="cursor-grab rounded bg-black/60 p-1.5 text-white hover:bg-black/80"
                data-drag-handle
              >
                <GripVertical className="h-4 w-4" />
              </div>
              <button
                type="button"
                onClick={deleteNode}
                className="rounded bg-black/60 p-1.5 text-white hover:bg-red-600"
                title="Remove video"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Bottom-right corner resize handle */}
            <div
              onMouseDown={onResizeStart}
              className="absolute right-0 bottom-0 z-10 flex h-6 w-6 cursor-nwse-resize items-center justify-center rounded-tl-md bg-blue-500/80 opacity-0 transition-opacity group-hover/video:opacity-100"
              title="Drag to resize"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" className="text-white">
                <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* Width indicator while resizing */}
            {resizing && (
              <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
                {width}%
              </div>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

declare module '@tiptap/core' {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string; width?: number }) => ReturnType;
    };
  }
}

export const VideoNode = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      width: {
        default: 100,
        parseHTML: (el) => {
          const style = el.style.width;
          if (style.endsWith('%')) return parseInt(style, 10);
          return 100;
        },
        renderHTML: (attrs) => ({
          style: `width: ${attrs.width}%; border-radius: 8px;`,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'video',
        getAttrs: (el) => {
          const element = el as HTMLVideoElement;
          const src =
            element.getAttribute('src') ||
            element.querySelector('source')?.getAttribute('src');
          return src ? { src } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      mergeAttributes(HTMLAttributes, {
        controls: 'true',
        preload: 'metadata',
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) => {
          return commands.insertContent([
            { type: this.name, attrs: { width: 100, ...options } },
            { type: 'paragraph' },
          ]);
        },
    };
  },
});
