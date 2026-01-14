import { Comment } from '@/app/types';

type CommentListProps = {
  comments: Comment[];
};

export default function CommentList({ comments }: CommentListProps) {
  return (
    <div className='mt-8 space-y-4'>
      <h2 className='text-xl font-semibold'>Comments</h2>
      {comments.length === 0 && <p className='text-gray-500'>No comments yet.</p>}
      {comments.map(comment => (
        <div key={comment.id} className='rounded border bg-gray-50 p-4'>
          <p className='font-medium'>{comment.authorName}</p>
          <p className='text-gray-700'>{comment.text}</p>
          <p className='text-sm text-gray-400'>{new Date(comment.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
