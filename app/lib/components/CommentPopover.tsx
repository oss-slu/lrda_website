import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CommentPopoverProps = {
  onSubmit: (text: string) => void;
  onClose: () => void;
  initialValue?: string;
  onTextChange?: (text: string) => void;
};

export default function CommentPopover({ onSubmit, onClose, initialValue = "", onTextChange }: CommentPopoverProps) {
  const [commentText, setCommentText] = useState(initialValue);

  // Update internal state when initialValue changes
  useEffect(() => {
    setCommentText(initialValue);
  }, [initialValue]);

  const handleTextChange = (value: string) => {
    setCommentText(value);
    if (onTextChange) {
      onTextChange(value);
    }
  };

  return (
    <div className="relative z-50 bg-white border shadow-lg rounded-lg p-4 w-full">
      <Textarea
        value={commentText}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="Write your comment..."
        className="w-full min-h-24 mb-3 resize-y"
        rows={4}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button
          size="sm"
          onClick={() => {
            if (commentText.trim()) {
              onSubmit(commentText.trim());
              handleTextChange("");
            }
          }}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
