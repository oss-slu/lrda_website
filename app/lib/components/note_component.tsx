"use client";
import {
  FontBoldIcon,
  FontItalicIcon,
  UnderlineIcon,
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
  QuoteIcon,
  ChatBubbleIcon,
  ListBulletIcon,
  InstagramLogoIcon,
  LinkedInLogoIcon,
} from "@radix-ui/react-icons";
import { Editor, EditorState, Modifier, RichUtils } from "draft-js";
import "draft-js/dist/Draft.css";
import { useState, useEffect } from "react";
import { stateToHTML } from "draft-js-export-html";
import { Button } from "@/components/ui/button";
import Sidebar from "./side_bar";


export default function ToolPage() {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [isNoteComponentVisible, setNoteComponentVisible] = useState(false);
  const [isToolPageVisible, setToolPageVisible] = useState(true); // Set initial visibility state


  useEffect(() => {
    // Additional effects as needed
  }, [editorState, isToolPageVisible]); 

  
  const handleKeyCommand = (command: string) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return "handled";
    }
    return "not-handled";
  };

  const toggleBold = () => {
    // Check if the current selection is bold
    const currentStyle = editorState.getCurrentInlineStyle();
    const isBold = currentStyle.has("BOLD");
  
    // Toggle the "BOLD" style
    let newEditorState = RichUtils.toggleInlineStyle(editorState, "BOLD");
  
    // If the selection was already bold, remove the "BOLD" style
    if (isBold) {
      newEditorState = RichUtils.toggleInlineStyle(newEditorState, "BOLD");
    }
  
    // Set the new editor state
    setEditorState(newEditorState);
  };
  

  const toggleItalic = () => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, "ITALIC"));
  };

  const toggleUnderline = () => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, "UNDERLINE"));
  };

  const handleTextAlignLeft = () => {
    setEditorState(RichUtils.toggleBlockType(editorState, 'left'));
  };

  const handleTextAlignCenter = () => {
    setEditorState(RichUtils.toggleBlockType(editorState, 'center'));
  };

const handleTextAlignRight = () => {
  setEditorState(RichUtils.toggleBlockType(editorState, 'right'));
};

const handleQuote = () => {
  setEditorState(RichUtils.toggleBlockType(editorState, 'blockquote'));
};

const handleChatBubble = () => {
  // Example: Inserting a custom chat bubble character
  const contentState = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  const newContentState = Modifier.insertText(
    contentState,
    selection,
    '💬', // You can replace this with your preferred chat bubble character
  );
  const newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');
  setEditorState(newEditorState);
};


  const handleListBullet = () => {
    setEditorState(RichUtils.toggleBlockType(editorState, 'unordered-list-item'));
  };

  const handleInstagramLogo = () => {
    // Implement Instagram logo functionality
  };

  const handleLinkedInLogo = () => {
    // Implement LinkedIn logo functionality
  };

  return (
    <div className={`flex flex-col h-screen ${isToolPageVisible ? '' : 'hidden'}`}>
   <Sidebar setNoteComponentVisible={setNoteComponentVisible} setToolPageVisible={setToolPageVisible} toolPageVisible={false} />


      {/* Tool icons above the NoteComponent */}
      <div className="flex items-center justify-start p-4 bg-gray-200">
        <Button
          onClick={toggleBold}
          className="mx-2 w-10 h-10 bg-secondary border-black rounded-full text-black"
          data-testid="Bold"
          
        >
          <FontBoldIcon />
        </Button>
        <Button
          onClick={toggleItalic}
          className="mx-2 w-10 h-10 bg-secondary border-black rounded-full text-black"
          data-testid="Italic"
        >
          <FontItalicIcon />
        </Button>
        <Button
          onClick={toggleUnderline}
          className="mx-2 w-10 h-10 bg-secondary border-black rounded-full text-black"
          data-testid="Underline"
        >
          <UnderlineIcon />
        </Button>
        <Button
          onClick={handleTextAlignLeft}
          className="mx-2 w-10 h-10 bg-secondary border-black rounded-full text-black"
          data-testid="TextAlignLeft"
        >
          <TextAlignLeftIcon />
        </Button>
        <Button
          onClick={handleTextAlignCenter}
          className="mx-2 w-10 h-10 bg-secondary border-black rounded-full text-black"
          data-testid="TextAlignCenter"
        >
          <TextAlignCenterIcon />
        </Button>
        <Button
          onClick={handleTextAlignRight}
          className="mx-2 w-10 h-10 bg-secondary border-black rounded-full text-black"
          data-testid="TextAlignRight"
        >
          <TextAlignRightIcon />
        </Button>
        <Button
          onClick={handleQuote}
          className="mx-2 w-10 h-10 bg-secondary border-black rounded-full text-black"
          data-testid="Quote"
        >
          <QuoteIcon />
        </Button>
        <Button
          onClick={handleChatBubble}
          className="mx-2 w-10 h-10 bg-secondary border-black rounded-full text-black"
          data-testid="ChatBubble"
        >
          <ChatBubbleIcon />
        </Button>
        <Button
          onClick={handleListBullet}
          className="mx-2 w-10 h-10 bg-secondary border-black rounded-full text-black"
          data-testid="ListBullet"
        >
          <ListBulletIcon />
        </Button>
        <Button
          onClick={handleInstagramLogo}
          className="mx-2 w-10 h-10 bg-secondary border-black rounded-full text-black"
          data-testid="InstagramLogo"
        >
          <InstagramLogoIcon />
        </Button>
        <Button
          onClick={handleLinkedInLogo}
          className="mx-2 w-10 h-10 bg-secondary border-black rounded-full text-black"
          data-testid="LinkedInLogo"
        >
          <LinkedInLogoIcon />
        </Button>
      </div>

  {/* Main content area with NoteComponent */}
  <main className="flex-grow p-6 lg:p-24">
        <div className="max-w-4xl">
          {isNoteComponentVisible && (
            <div className={`mt-2 p-4 rounded-lg w-full bg-white`}>
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const editorStyles = {
  border: "1px solid black",
  padding: "10px",
  borderRadius: "4px",
  minHeight: "300px",
  width: "800px",
  color: "black",
  backgroundColor: "white",
};






