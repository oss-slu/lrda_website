import { createFileRoute } from '@tanstack/react-router'
import WelcomePage from '@/app/WelcomePage'
import AboutPage from '@/app/lib/components/home/about_section'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ title: "Where's Religion?" }],
  }),
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <WelcomePage />
      <AboutPage />
    </>
  )
}
