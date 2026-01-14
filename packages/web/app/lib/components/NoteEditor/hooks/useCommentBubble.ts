import { useState, useEffect, RefObject } from "react";
import type { RichTextEditorRef } from "mui-tiptap";

interface CommentBubblePosition {
  top: number;
  left: number;
}

interface UseCommentBubbleResult {
  showCommentBubble: boolean;
  commentBubblePosition: CommentBubblePosition | null;
  setShowCommentBubble: (show: boolean) => void;
}

interface UseCommentBubbleOptions {
  rteRef: RefObject<RichTextEditorRef | null>;
  canComment: boolean;
  isViewingStudentNote: boolean;
  isStudentViewingOwnNote: boolean;
}

export const useCommentBubble = ({
  rteRef,
  canComment,
  isViewingStudentNote,
  isStudentViewingOwnNote,
}: UseCommentBubbleOptions): UseCommentBubbleResult => {
  const [showCommentBubble, setShowCommentBubble] = useState<boolean>(false);
  const [commentBubblePosition, setCommentBubblePosition] = useState<CommentBubblePosition | null>(null);

  useEffect(() => {
    const editor = rteRef.current?.editor;
    if (!editor || !canComment || (!isViewingStudentNote && !isStudentViewingOwnNote)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- early return to hide bubble when conditions not met
      setShowCommentBubble(false);
      return;
    }

    const updateBubblePosition = () => {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;

      if (hasSelection) {
        try {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const editorContainer = editor.view.dom.closest(".ProseMirror")?.getBoundingClientRect();

            if (editorContainer && rect.width > 0 && rect.height > 0) {
              const top = rect.top - editorContainer.top - 45;
              const left = rect.right - editorContainer.left + 10;

              setCommentBubblePosition({ top, left });
              setShowCommentBubble(true);
            }
          }
        } catch (error) {
          console.error("Error calculating comment bubble position:", error);
          setShowCommentBubble(false);
        }
      } else {
        setShowCommentBubble(false);
      }
    };

    const handleSelectionUpdate = () => {
      setTimeout(updateBubblePosition, 10);
    };

    const handleScroll = () => {
      if (showCommentBubble) {
        updateBubblePosition();
      }
    };

    editor.on("selectionUpdate", handleSelectionUpdate);

    const handleMouseUp = () => {
      setTimeout(updateBubblePosition, 10);
    };

    const editorElement = editor.view.dom;
    const scrollContainer =
      editorElement.closest("[data-radix-scroll-area-viewport]") ||
      editorElement.closest(".overflow-auto") ||
      editorElement.closest(".ScrollArea") ||
      editorElement.parentElement;

    editorElement.addEventListener("mouseup", handleMouseUp);
    editorElement.addEventListener("keyup", handleSelectionUpdate);

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      editorElement.removeEventListener("mouseup", handleMouseUp);
      editorElement.removeEventListener("keyup", handleSelectionUpdate);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [rteRef, canComment, isViewingStudentNote, isStudentViewingOwnNote, showCommentBubble]);

  return {
    showCommentBubble,
    commentBubblePosition,
    setShowCommentBubble,
  };
};
