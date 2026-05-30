import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type CommentPopoverProps = {
  onSubmit: (text: string) => void;
  onClose: () => void;
  initialValue?: string;
  onTextChange?: (text: string) => void;
};

export default function CommentPopover({
  onSubmit,
  onClose,
  initialValue = '',
  onTextChange,
}: CommentPopoverProps) {
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
    <div className='relative z-50 w-full rounded-lg border bg-white p-4 shadow-lg'>
      <Textarea
        value={commentText}
        onChange={e => handleTextChange(e.target.value)}
        placeholder='Write your comment...'
        className='mb-3 min-h-24 w-full resize-y'
        rows={4}
      />
      <div className='flex justify-end gap-2'>
        <Button variant='outline' size='sm' onClick={onClose}>
          Cancel
        </Button>
        <Button
          size='sm'
          onClick={() => {
            if (commentText.trim()) {
              onSubmit(commentText.trim());
              handleTextChange('');
            }
          }}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
