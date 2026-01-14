"use client";

import React, { useState, RefObject } from "react";
import { LinkBubbleMenu, RichTextEditor, type RichTextEditorRef } from "mui-tiptap";
import type { Editor } from "@tiptap/core";
import { v4 as uuidv4 } from "uuid";
import TagManager from "../noteElements/tag_manager";
import EditorMenuControls from "../editor_menu_controls";
import useExtensions from "@/app/lib/utils/use_extensions";
import ApiService from "@/app/lib/utils/api_service";
import { PhotoType, VideoType, AudioType } from "@/app/lib/models/media_class";
import CommentBubble from "../CommentBubble";
import { handleTagsChange, handleEditorChange } from "./handlers/noteHandlers";
import type { NoteStateType, NoteHandlersType } from "./hooks/useNoteState";

interface NoteEditorContentProps {
  noteState: NoteStateType;
  noteHandlers: NoteHandlersType;
  rteRef: RefObject<RichTextEditorRef | null>;
  editorSessionKey: string;
  isViewingStudentNote: boolean;
  canComment: boolean;
  isStudentViewingOwnNote: boolean;
  showCommentBubble: boolean;
  commentBubblePosition: { top: number; left: number } | null;
  onCommentBubbleClick: () => void;
  onEdit: () => void;
}

export default function NoteEditorContent({
  noteState,
  noteHandlers,
  rteRef,
  editorSessionKey,
  isViewingStudentNote,
  canComment,
  isStudentViewingOwnNote,
  showCommentBubble,
  commentBubblePosition,
  onCommentBubbleClick,
  onEdit,
}: NoteEditorContentProps) {
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(false);

  const extensions = useExtensions({
    placeholder: "Add your own content here...",
  });

  const fetchSuggestedTags = async () => {
    setLoadingTags(true);
    try {
      const editor = rteRef.current?.editor;
      if (editor) {
        const noteContent = editor.getHTML();
        const tags = await ApiService.generateTags(noteContent);
        setSuggestedTags(tags);
      } else {
        console.error("Editor instance is not available");
      }
    } catch (error) {
      console.error("Error generating tags:", error);
    } finally {
      setLoadingTags(false);
    }
  };

  const handleMediaUpload = (media: { type: string; uri: string }) => {
    const editor = rteRef.current?.editor;

    if (media.type === "image") {
      const defaultWidth = 100;
      const defaultHeight: number | undefined = undefined;

      const newImage = {
        type: "image",
        attrs: {
          src: media.uri,
          alt: "Image description",
          loading: "lazy",
          width: defaultWidth,
          height: defaultHeight,
        },
      };

      if (editor) {
        editor.chain().focus().setImage(newImage.attrs).run();
      }

      noteHandlers.setImages((prevImages) => [
        ...prevImages,
        new PhotoType({
          uuid: uuidv4(),
          uri: media.uri,
          type: "image",
        }),
      ]);
    } else if (media.type === "video") {
      const newVideo = new VideoType({
        uuid: uuidv4(),
        uri: media.uri,
        type: "video",
        thumbnail: "",
        duration: "0:00",
      });

      noteHandlers.setVideos((prevVideos) => [...prevVideos, newVideo]);

      if (editor) {
        const videoLink = `Video ${noteState.videos.length + 1}`;
        editor
          .chain()
          .focus()
          .command(({ tr, dispatch }) => {
            if (dispatch) {
              const endPos = tr.doc.content.size;
              const paragraphNodeForNewLine = editor.schema.node("paragraph");
              const textNode = editor.schema.text(videoLink, [
                editor.schema.marks.link.create({ href: media.uri }),
              ]);
              const paragraphNodeForLink = editor.schema.node("paragraph", null, [textNode]);

              const transaction = tr
                .insert(endPos, paragraphNodeForNewLine)
                .insert(endPos + 1, paragraphNodeForLink);
              dispatch(transaction);
            }
            return true;
          })
          .run();
      }
    } else if (media.type === "audio") {
      const newAudio = new AudioType({
        uuid: uuidv4(),
        uri: media.uri,
        type: "audio",
        duration: "0:00",
        name: `Audio Note ${noteState.audio.length + 1}`,
        isPlaying: false,
      });

      noteHandlers.setAudio((prevAudio) => [...prevAudio, newAudio]);
    }
  };

  return (
    <>
      <div className="mt-2">
        <TagManager
          inputTags={noteState.tags}
          suggestedTags={suggestedTags}
          onTagsChange={(newTags) => {
            onEdit();
            handleTagsChange(noteHandlers.setTags, newTags);
          }}
          fetchSuggestedTags={fetchSuggestedTags}
          disabled={isViewingStudentNote}
        />
      </div>

      {loadingTags && <p>Loading suggested tags...</p>}

      <div
        className="w-full pb-8 transition-opacity duration-200 ease-in-out"
        onMouseDown={(e) => {
          const editor = rteRef.current?.editor;
          if (!editor) return;
          const target = e.target as HTMLElement;
          if (!target.closest(".ProseMirror")) {
            e.preventDefault();
            editor.chain().focus("start").run();
          }
        }}
        onKeyDown={(e) => {
          const editor = rteRef.current?.editor;
          if (!editor) return;
          if (e.key === "ArrowDown" && editor.isEmpty) {
            e.preventDefault();
            editor.chain().focus().insertContent("<p><br/></p>").run();
          }
        }}
      >
        <div className="bg-white w-full relative">
          {showCommentBubble && commentBubblePosition && canComment && (isViewingStudentNote || isStudentViewingOwnNote) && (
            <CommentBubble
              onClick={onCommentBubbleClick}
              top={commentBubblePosition.top}
              left={commentBubblePosition.left}
            />
          )}
          <RichTextEditor
            key={editorSessionKey}
            ref={rteRef}
            className="min-h-[400px] prose prose-lg max-w-none"
            extensions={extensions}
            content={noteState.editorContent}
            immediatelyRender={false}
            editable={!isViewingStudentNote}
            onUpdate={({ editor }: { editor: Editor }) => {
              if (!isViewingStudentNote) {
                onEdit();
                handleEditorChange(noteHandlers.setEditorContent, editor.getHTML());
              }
            }}
            renderControls={() =>
              isViewingStudentNote ? null : (
                <EditorMenuControls onMediaUpload={handleMediaUpload} />
              )
            }
            children={(editor: Editor | null) => {
              if (!editor) return null;
              return <LinkBubbleMenu />;
            }}
          />
        </div>
      </div>
    </>
  );
}
