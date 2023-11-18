"use client";

import { Editor, EditorState, RichUtils } from "draft-js";
import "draft-js/dist/Draft.css";
import { useState, useEffect } from "react";
import { stateToHTML } from 'draft-js-export-html';

interface NoteComponentProps {
  isNoteComponentVisible: boolean;
  onClose: () => void; // Function to close the component
}

const NoteComponent: React.FC<NoteComponentProps> = ({ isNoteComponentVisible, onClose }) => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleKeyCommand = (command: any) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return "handled";
    }
    return "not-handled";
  };

  const toggleBold = () => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, "BOLD"));
  };

  const toggleItalic = () => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, "ITALIC"));
  };

  const toggleUnderline = () => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, "UNDERLINE"));
  };

  const handleClose = () => {
    // Call the onClose function to close the component
    onClose();
  };

  return (
    <div className="border border-black p-4 rounded-lg" style={{ display: isNoteComponentVisible ? 'block' : 'none', maxWidth: '600px' }}>
      <div className="flex justify-end mb-2">
        <button onClick={handleClose} className="border border-black p-2 rounded-md text-black">
          Close
        </button>
      </div>
      <button onClick={toggleBold} className="border border-black p-2 m-1 rounded-md text-black">
        Bold
      </button>
      <button onClick={toggleItalic} className="border border-black p-2 m-1 rounded-md text-black">
        Italic
      </button>
      <button onClick={toggleUnderline} className="border border-black p-2 m-1 rounded-md text-black">
        Underline
      </button>
      <div style={{ ...editorStyles, width: '100%' }}>
        {isClient && (
          <Editor
            editorState={editorState}
            onChange={setEditorState}
            handleKeyCommand={handleKeyCommand}
            editorKey="editor"
            placeholder="Start writing your notes here . . ."
            spellCheck={true}
            ariaLabel="Text editor"
            ariaMultiline={true}
          />
        )}
      </div>
    </div>
  );
};

const editorStyles = {
  border: "1px solid black",
  padding: "10px",
  borderRadius: "4px",
  color: "black",
  backgroundColor: "white",
};

export default NoteComponent;




