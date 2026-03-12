import { createFileRoute } from '@tanstack/react-router'
import Notes from '@/app/notes/Notes'

export const Route = createFileRoute('/notes/')({
  head: () => ({
    meta: [{ title: "My Notes | Where's Religion?" }],
  }),
  component: NotesPage,
})

function NotesPage() {
  return <Notes />
}
