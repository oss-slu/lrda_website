import { MessageCircle } from "lucide-react";

type CommentBubbleProps = {
  onClick: () => void;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
};

export default function CommentBubble({ onClick, top, left, right, bottom }: CommentBubbleProps) {
  const positionStyle: React.CSSProperties = {};
  
  if (top !== undefined) positionStyle.top = typeof top === 'number' ? `${top}px` : top;
  if (left !== undefined) positionStyle.left = typeof left === 'number' ? `${left}px` : left;
  if (right !== undefined) positionStyle.right = typeof right === 'number' ? `${right}px` : right;
  if (bottom !== undefined) positionStyle.bottom = typeof bottom === 'number' ? `${bottom}px` : bottom;
  
  // Default to center if no position provided
  if (Object.keys(positionStyle).length === 0) {
    positionStyle.top = '50%';
    positionStyle.left = '50%';
    positionStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <button 
      onClick={onClick} 
      className="fixed z-[9999] bg-white rounded-full p-1.5 shadow-lg border border-gray-300 hover:shadow-xl hover:bg-blue-50 transition-all"
      style={positionStyle}
    >
      <MessageCircle className="text-blue-500 hover:text-blue-700 w-5 h-5" />
    </button>
  );
}
