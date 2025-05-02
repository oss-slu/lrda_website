import { MessageCircle } from "lucide-react";

type CommentBubbleProps = {
  onClick: () => void;
};

export default function CommentBubble({ onClick }: CommentBubbleProps) {
  return (
    <button onClick={onClick} className="absolute">
      <MessageCircle className="text-blue-500 hover:text-blue-700" />
    </button>
  );
}
