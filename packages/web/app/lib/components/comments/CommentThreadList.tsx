import type { CommentData } from '@/app/lib/services/comments.types';
import { Button } from '@/components/ui/button';

interface CommentThreadListProps {
  comments: CommentData[];
  isInstructor: boolean;
  canComment: boolean;
  replyDrafts: Record<string, string>;
  onReplyDraftChange: (threadId: string, value: string) => void;
  onReply: (threadId: string, rootCommentId: string) => void;
  onResolveThread: (threadId: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export function CommentThreadList({
  comments,
  isInstructor,
  canComment,
  replyDrafts,
  onReplyDraftChange,
  onReply,
  onResolveThread,
  onDeleteComment,
}: CommentThreadListProps) {
  const threads = comments
    .filter(c => !c.parentId)
    .map(root => {
      const tid = root.threadId || root.id;
      return {
        root: { ...root, threadId: tid },
        replies: comments.filter(r => r.parentId === root.id),
      };
    });

  if (threads.length === 0) {
    return <p className='text-gray-400'>No comments yet.</p>;
  }

  return (
    <div className='space-y-2.5 sm:space-y-3'>
      {threads.map(({ root, replies }) => (
        <div
          key={root.id}
          className='space-y-2 rounded-md border border-gray-200 bg-gray-50 p-2 sm:p-2.5'
        >
          <div className='flex items-start justify-between'>
            <div className='min-w-0'>
              <p className='truncate text-[13px] font-semibold sm:text-sm'>
                {root.authorName}
                {root.resolved && (
                  <span className='ml-2 text-xs text-green-600'>(Resolved)</span>
                )}
              </p>
              <p className='whitespace-pre-wrap break-words text-[12px] text-gray-700 sm:text-xs'>
                {root.text}
              </p>
              <p className='text-[10px] text-gray-400 sm:text-[11px]'>
                {new Date(root.createdAt).toLocaleString()}
              </p>
            </div>
            {isInstructor && (
              <div className='ml-2 flex shrink-0 gap-1.5'>
                {!root.resolved && (
                  <Button
                    size='sm'
                    className='h-7 px-2 text-xs'
                    variant='secondary'
                    onClick={() => onResolveThread(root.threadId)}
                  >
                    Resolve
                  </Button>
                )}
                <Button
                  size='sm'
                  className='h-7 px-2 text-xs'
                  variant='ghost'
                  onClick={() => onDeleteComment(root.id)}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>

          {replies.length > 0 && (
            <div className='ml-2 space-y-1.5 border-l-2 border-blue-200 pl-2 sm:ml-3 sm:pl-3'>
              {replies.map(r => (
                <div key={r.id}>
                  <p className='truncate text-[12px] font-medium sm:text-xs'>
                    {r.authorName}
                  </p>
                  <p className='whitespace-pre-wrap break-words text-[12px] text-gray-700 sm:text-xs'>
                    {r.text}
                  </p>
                  <div className='flex items-center justify-between'>
                    <p className='text-[10px] text-gray-400 sm:text-[11px]'>
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                    {isInstructor && (
                      <Button
                        size='sm'
                        className='h-7 px-2 text-xs'
                        variant='ghost'
                        onClick={() => onDeleteComment(r.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {canComment && !root.resolved && (
            <div className='mt-1.5 flex gap-1.5'>
              <input
                className='flex-1 rounded border border-gray-300 px-2 py-1 text-[12px] focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200 sm:text-xs'
                placeholder='Reply...'
                value={replyDrafts[root.threadId || root.id] || ''}
                onChange={e =>
                  onReplyDraftChange(root.threadId || root.id, e.target.value)
                }
              />
              <Button
                size='sm'
                className='h-7 px-2 text-xs'
                onClick={() => onReply(root.threadId || root.id, root.id)}
              >
                Reply
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
