import { createFileRoute } from '@tanstack/react-router';
import Notes from '@/components/notes/Notes';

export const Route = createFileRoute('/_app/_authenticated/notes/')({
  head: () => ({
    meta: [{ title: "My Notes | Where's Religion?" }],
  }),
  component: NotesPage,
});

function NotesPage() {
  return <Notes />;
}
