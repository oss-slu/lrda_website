import { createFileRoute, useRouter } from '@tanstack/react-router';
import { extractTextFromJson } from '@/utils/sanitize';
import { useNoteDetail, noteDetailOptions } from '@/hooks/queries/useNotes';
import { Button } from '@/components/ui/button';
import NoteDetail from '@/components/NoteDetail';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/_public/notes/$id')({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(noteDetailOptions(params.id)),
  head: ({ loaderData, params }) => {
    const title =
      loaderData?.title ? `${loaderData.title} | Where's Religion?` : "Note | Where's Religion?";
    const description =
      loaderData?.textJson ? extractTextFromJson(loaderData.textJson).slice(0, 160) : undefined;
    const url = `https://wheresreligion.org/notes/${params.id}`;
    return {
      meta: [
        { title },
        { property: 'og:title', content: loaderData?.title ?? 'Note' },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: url },
        { name: 'twitter:title', content: loaderData?.title ?? 'Note' },
        ...(description ?
          [
            { name: 'description', content: description },
            { property: 'og:description', content: description },
            { name: 'twitter:description', content: description },
          ]
        : []),
      ],
      links: [{ rel: 'canonical', href: url }],
    };
  },
  component: NoteDetailPage,
});

function NoteDetailPage() {
  const { id: noteId } = Route.useParams();
  const router = useRouter();

  const { data: note, isLoading, error: queryError } = useNoteDetail(noteId);

  if (isLoading) {
    return (
      <div className='text-muted-foreground flex min-h-full items-center justify-center'>
        Loading...
      </div>
    );
  }

  if (queryError || !note) {
    return (
      <div className='flex min-h-full flex-col items-center justify-center gap-4'>
        <p className='text-destructive text-lg font-semibold'>
          {queryError ? 'Failed to load note' : 'Note not found'}
        </p>
        <Button onClick={() => router.history.back()}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to map
        </Button>
      </div>
    );
  }

  return (
    <div className='bg-muted/40 min-h-full py-6'>
      <div className='mx-auto w-full max-w-5xl overflow-hidden rounded-xl border bg-white shadow-sm'>
        <NoteDetail noteId={noteId} variant='page' />
      </div>
    </div>
  );
}
