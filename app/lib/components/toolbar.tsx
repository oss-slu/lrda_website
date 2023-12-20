import { Editor } from "@tiptap/react";
import {
  BoldIcon,
  UnderlineIcon,
  ItalicIcon,
  ListOrderedIcon,
  TextQuoteIcon,
  UndoIcon,
  RedoIcon,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ToolBarProps {
  editor: Editor | null;
}

const ToolBar: React.FC<ToolBarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }
  const toggleBold = () => {
    editor.chain().focus().toggleBold().run();
  };
  const isBoldActive = editor.isActive("bold");
  return (
    <div className="flex justify-center space-x-2 p-2">
      <ToggleGroup type="multiple" aria-label="Text formatting">
        <ToggleGroupItem
          value="undo"
          onClick={() => editor.chain().focus().undo().run()}
          aria-label="Undo"
        >
          <UndoIcon className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="redo"
          onClick={() => editor.chain().focus().redo().run()}
          aria-label="Redo"
        >
          <RedoIcon className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="bold"
          onClick={toggleBold}
          aria-label="Bold"
          className={isBoldActive ? "active-btn" : "btn"}
        >
          <BoldIcon className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
          className={editor.isActive("italic") ? "active-btn" : "btn"}
        >
          <ItalicIcon className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Underline"
          className={editor.isActive("underline") ? "active-btn" : "btn"}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="orderedList"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Ordered List"
          className={editor.isActive("orderedList") ? "active-btn" : "btn"}
        >
          <ListOrderedIcon className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="blockquote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="Blockquote"
          className={editor.isActive("blockquote") ? "active-btn" : "btn"}
        >
          <TextQuoteIcon className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};
export default ToolBar;
