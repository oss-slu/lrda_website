import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CommentPopoverProps = {
  onSubmit: (text: string) => void;
  onClose: () => void;
};

export default function CommentPopover({ onSubmit, onClose }: CommentPopoverProps) {
  const [commentText, setCommentText] = useState("");

  return (
    <div className="absolute z-50 bg-white border shadow-md rounded p-4">
      <Textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder="Write your comment..."
        className="w-64 h-24 mb-2"
      />
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => {
            if (commentText.trim()) {
              onSubmit(commentText.trim());
              setCommentText("");
            }
          }}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
