import { createFileRoute } from '@tanstack/react-router'
import WelcomePage from '@/app/WelcomePage'
import AboutPage from '@/app/lib/components/home/about_section'

export const Route = createFileRoute('/')({
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
