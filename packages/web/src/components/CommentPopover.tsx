import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type CommentPopoverProps = {
  value: string;
  onSubmit: (text: string) => void;
  onClose: () => void;
  onTextChange: (text: string) => void;
};

export default function CommentPopover({
  value,
  onSubmit,
  onClose,
  onTextChange,
}: CommentPopoverProps) {
  return (
    <div className='relative z-50 w-full rounded-lg border bg-white p-4 shadow-lg'>
      <Textarea
        value={value}
        onChange={e => onTextChange(e.target.value)}
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
            if (value.trim()) {
              onSubmit(value.trim());
              onTextChange('');
            }
          }}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
