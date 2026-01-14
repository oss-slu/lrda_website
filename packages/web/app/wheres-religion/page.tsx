'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useReveal, motionVariants } from '@/app/lib/utils/motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Collapsible Section Component
function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  id,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  id?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { ref, isVisible } = useReveal<HTMLDivElement>();

  return (
    <div
      id={id}
      ref={ref}
      className={`mb-4 scroll-mt-20 ${motionVariants.fadeInUp}`}
      data-reveal={isVisible}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='group w-full rounded-xl border-2 border-blue-200/60 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 p-5 text-left transition-all duration-200 hover:border-blue-300 hover:shadow-md'
      >
        <div className='flex items-center justify-between'>
          <h3 className='text-xl font-bold text-slate-800 transition-colors group-hover:text-blue-700'>
            {title}
          </h3>
          <div className='ml-4 flex-shrink-0'>
            {isOpen ?
              <ChevronUp className='h-5 w-5 text-blue-600' />
            : <ChevronDown className='h-5 w-5 text-blue-600' />}
          </div>
        </div>
      </button>
      {isOpen && (
        <div className='mt-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
          {children}
        </div>
      )}
    </div>
  );
}

export default function WheresReligionPage() {
  const { ref: heroRef, isVisible: heroVisible } = useReveal<HTMLDivElement>();

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50'>
      {/* Hero Section */}
      <div
        ref={heroRef}
        className={`relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8 ${motionVariants.fadeIn}`}
        data-reveal={heroVisible}
      >
        {/* Animated background elements */}
        <div className='pointer-events-none absolute inset-0 overflow-hidden'>
          <div className='absolute left-10 top-20 h-72 w-72 animate-pulse rounded-full bg-blue-400/20 blur-3xl' />
          <div
            className='absolute bottom-20 right-10 h-96 w-96 animate-pulse rounded-full bg-blue-400/20 blur-3xl'
            style={{ animationDelay: '1s' }}
          />
        </div>

        <div className='relative z-10 mx-auto max-w-4xl text-center'>
          <h1 className='mb-4 bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-4xl font-black text-transparent text-white sm:text-5xl lg:text-6xl'>
            WHERE'S RELIGION?
          </h1>
          <p className='mb-8 text-xl font-light text-white/90 sm:text-2xl'>
            Your guide to understanding the platform
          </p>
          <Link href='/#aboutSection'>
            <Button
              variant='outline'
              size='lg'
              className='rounded-xl border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/20 hover:text-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600'
            >
              ← Back to About
            </Button>
          </Link>
        </div>
      </div>

      <div className='mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8'>
        {/* About Section */}
        <section className='mb-12'>
          <div className='rounded-r-lg border-l-4 border-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 p-6 shadow-sm sm:p-8'>
            <h2 className='mb-4 text-3xl font-bold text-slate-900'>About Where's Religion?</h2>
            <p className='text-lg leading-relaxed text-slate-700'>
              Welcome! We are excited to share this app with you. Whether you are a student, a
              researcher, or anyone else with an interest in developing a deeper understanding of
              religion as it relates to the everyday lives of humans across the globe, "Where's
              Religion?" offers a number of tools to develop questions and seek understanding. This
              document addresses some key questions and provides information about the intellectual
              and technical design of the mobile and desktop applications.
            </p>
          </div>
        </section>

        {/* Getting Started Section */}
        <section id='getting-started' className='mb-12 scroll-mt-20'>
          <div className='mb-8 text-center'>
            <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2'>
              <span className='bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-xl font-bold text-transparent'>
                GETTING STARTED
              </span>
            </div>
          </div>

          <CollapsibleSection title="What is Where's Religion?" defaultOpen={true}>
            <div className='space-y-4 text-slate-700'>
              <p className='leading-relaxed'>
                Where's Religion? is an open-source mobile and desktop web application developed by
                humanities faculty and IT professionals at Saint Louis University that supports
                in-person research, remote data entry, media sharing, and mapping. Where's Religion?
                is designed to facilitate a more robust public understanding of religion through
                rigorous scholarly methods. Our conviction is that the study of religion must
                account for the wide range of embodied experiences, improvised practices, material
                cultures, and shared spaces that humans inhabit.
              </p>
              <p className='leading-relaxed'>
                Through a research methodology that moves beyond analysis of sacred texts, creeds,
                and official teachings, Where's Religion? provides a platform to diversify the data
                we study and to advance the study of religion we all encounter in everyday life.
              </p>
              <p className='leading-relaxed'>
                Where's Religion? began as a solution to the limitations for studying and
                understanding the embodied and emplaced experiences of religion. There was and is
                currently no free and open-source app for in-person research that captures all media
                forms and curates entries on a map. The core set of functions of this app -
                note-taking, media uploads, and mapping - are intended to resolve this.
              </p>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Why build Where's Religion?">
            <div className='space-y-4 text-slate-700'>
              <p className='leading-relaxed'>
                Where's Religion? enables collaborative research on lived religion. To date, much of
                the research data on religion in public life is siloed in individual researchers'
                files and fractured across multiple digital projects. When researching and teaching
                around religion in St. Louis, Rachel McBride Lindsey and Pauline Chen Lee, both
                faculty at Saint Louis University, realized that there could be more generative uses
                of digital research methods to increase knowledge–both public and academic–from the
                materials they were encountering and collecting.
              </p>
              <p className='leading-relaxed'>
                Where's Religion? is not finished. As a digital application, we envision several
                additional functionalities in the coming months and years. One example is a suite of
                tools for educators to access and engage their students' Notes before publishing to
                the Library. Knowledge production is a conversation and we are eager to hear from
                users–researchers and learners alike–about what works best, what needs to be
                improved, and what your ideas are for improving the experience and/or functionality
                of these resources.
              </p>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="How to use Where's Religion?">
            <div className='space-y-6'>
              <div className='rounded-lg border border-blue-200 bg-blue-50/50 p-5'>
                <h4 className='mb-3 text-lg font-semibold text-slate-800'>
                  I am a learner interested in browsing published Field Notes and other content.
                </h4>
                <div className='space-y-3 text-slate-700'>
                  <p className='leading-relaxed'>
                    Where's Religion? has multiple ways of navigating published Field Notes (Notes
                    include multimedia content as well as varying amounts of descriptive and
                    interpretive writing by refereed researchers). You can navigate by moving around
                    the interactive map, by scrolling the sidebar of previews, or by typing keywords
                    into the search bar. More filter functions are forthcoming.
                  </p>
                  <p className='leading-relaxed'>
                    Please credit Where's Religion?, Center on Lived Religion, Saint Louis
                    University, in any media references.
                  </p>
                  <p className='leading-relaxed'>
                    If you cite specific materials, credit the author of the Field Note and Where's
                    Religion? in your citation (e.g. Rachel McBride Lindsey, "Holy Family Catholic
                    Church," Where's Religion?, Saint Louis University, accessed February 12, 2024).
                  </p>
                </div>
              </div>

              <div
                id='for-researchers'
                className='scroll-mt-20 rounded-lg border border-blue-200 bg-blue-50/50 p-5'
              >
                <h4 className='mb-3 text-lg font-semibold text-slate-800'>
                  I am a researcher interested in creating Field Notes.
                </h4>
                <div className='space-y-3 text-slate-700'>
                  <p className='leading-relaxed'>
                    All researchers need to create a research profile by downloading and installing
                    the Where's Religion? mobile app. Examples of researchers include students
                    enrolled in collegiate courses in theology, religious studies, and related
                    fields; graduate students; university faculty; museum professionals; independent
                    scholars; filmmakers; photographers; and others with training in human-subject
                    and/or place-based research. To register as a researcher, find the Where's
                    Religion? app for Apple or Android devices, install, and self-register.
                    Registered researchers agree to conduct their research ethically and in
                    accordance with the terms of use.
                  </p>
                  <p className='rounded border border-slate-200 bg-white/50 p-3 italic leading-relaxed text-slate-600'>
                    Note: it is the responsibility of each researcher to determine if their research
                    requires approval through their local Institutional Review Board (IRB). Where's
                    Religion? is a platform for collecting and sharing research across multiple
                    institutions and affiliations. Use of Where's Religion? does not extend any
                    institutional oversight or liability by Saint Louis University.
                  </p>
                  <p className='leading-relaxed'>
                    Once registered, Where's Religion? allows users to take notes, capture photos
                    and videos, and record audio files - all of which are plotted on a global,
                    searchable, filterable map interface. All of these tasks can be done in real
                    time while using the mobile app.
                  </p>
                  <p className='leading-relaxed'>
                    The Where's Religion? desktop app is designed with additional capabilities. It
                    provides users with a more feature-rich format to refine fieldnotes, edit media,
                    make new entries, or, for certain user profiles, review or evaluate other users'
                    entries.
                  </p>
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </section>

        {/* FAQs Section */}
        <section id='faqs' className='mb-12 scroll-mt-20'>
          <div className='mb-8 text-center'>
            <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2'>
              <span className='bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-xl font-bold text-transparent'>
                FREQUENTLY ASKED QUESTIONS
              </span>
            </div>
          </div>

          <CollapsibleSection title='What is "religion"?'>
            <div className='space-y-4 text-slate-700'>
              <p className='font-medium italic leading-relaxed text-blue-700'>
                Spoiler: this is a trick question! Sort of.
              </p>
              <p className='leading-relaxed'>
                Religion can be–and is–defined in many ways, by different people, at different
                points in time, in different places, and to different effects. For example, in the
                United States, we might define "religion" as a theological category (attending to
                knowledge about, from, and with divine beings), a cultural category (attending to
                human behaviors and practices), a constitutional category (attending to the benefits
                and privileges afforded by the U.S. constitution), and a category of analysis
                (attending to how researchers organize and analyze their sources).
              </p>
              <p className='leading-relaxed'>
                Where's Religion? is built to provoke this question of definition and also to shift
                attention from what to where. Thinking deliberately about where also prompts us to
                think about why–why this expression in this place? How can circumstances of
                migration, sexuality, economics, politics, race, gender–etc., etc., etc.--help us
                better understand religion?
              </p>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title='What is "lived religion"?'>
            <div className='space-y-4 text-slate-700'>
              <p className='leading-relaxed'>
                Where's Religion? starts with the premise that religion is what people do. For much
                of modern history, "religion" has been understood both popularly and in academia as
                systems of thought and belief that are best represented in authoritative texts.
                Similarly, the public study of religion has emphasized quantitative rates of
                adherence to various traditions and/or practices.
              </p>
              <p className='leading-relaxed'>
                While beliefs and doctrines are central to many religious traditions, they do not
                tell the entire story. Where's Religion? builds on decades of research to better
                understand religion as it is practiced, represented, engaged, embodied, and
                contested in human experience. One need not "be religious" to be shaped by religious
                systems and practices.
              </p>
              <p className='leading-relaxed'>
                Check out our Zotero Library here:{' '}
                <a
                  href='https://www.zotero.org/groups/5405623/livedreligion/library'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='font-medium text-blue-600 underline hover:text-blue-800'
                >
                  https://www.zotero.org/groups/5405623/livedreligion/library
                </a>
              </p>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title='What is a Field Note?'>
            <p className='leading-relaxed text-slate-700'>
              A Field Note is the entire entry that research users create within the Where's
              Religion? mobile and/or desktop app(s). It consists of written observations, affective
              responses, and analyses; still photography; video; sound; time; date; and/or location.
              The app automatically collects time, date, and lat/long of new Field Notes (but
              researchers can manually adjust if needed). We highly encourage all Field Notes to
              include visual and/or audio materials.
            </p>
          </CollapsibleSection>

          <CollapsibleSection title="How do I cite Where's Religion?">
            <div className='space-y-4 text-slate-700'>
              <p className='leading-relaxed'>
                For general media, credit Where's Religion?, Center on Lived Religion, Saint Louis
                University. Also credit Rachel McBride Lindsey, Ph.D. as Principal Investigator and
                Miles Adam Park, Ph.D., as Associate Director of Research. We request that media
                hyperlink to the desktop app when possible.
              </p>
              <p className='leading-relaxed'>
                Preferred academic citation follows the Chicago Manual of Style guidelines for
                Multimedia App Content (Section 14.268).
              </p>
              <div className='rounded-lg border border-slate-200 bg-slate-50 p-4'>
                <p className='mb-2 text-sm font-semibold text-slate-900'>
                  For bibliographic citations of the project:
                </p>
                <p className='mb-2 text-sm italic text-slate-700'>
                  Lindsey, Rachel McBride and Miles Adam Park. Where's Religion?. Desktop ed., v.
                  1.0. Center on Lived Religion, Saint Louis University, [date of last access].
                </p>
                <p className='mb-2 text-sm italic text-slate-700'>
                  Lindsey, Rachel McBride and Miles Adam Park. Where's Religion?. Mobile ed., v.
                  1.0. Center on Lived Religion, Saint Louis University, [date of last access].
                </p>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Who built Where's Religion?">
            <div className='space-y-4 text-slate-700'>
              <p className='leading-relaxed'>
                Where's Religion? was conceptualized in the classrooms of Rachel McBride Lindsey and
                Pauline Chen Lee, both of whom are professors in the Department of Theological
                Studies at Saint Louis University. Both Lindsey and Lee used available resources to
                teach their students how to document and share knowledge about religion in the St.
                Louis metro.
              </p>
              <p className='leading-relaxed'>
                Adam Park, manages the interdisciplinary design and development and the project has
                benefited from the technical development of Patrick Cuba, Bryan Haberberger, Yash
                Bhatia, Stuart Ray, Izak Robles, Josh Hogan, Tianhao Wang, Andrew Chen, and Tom
                Irvine.
              </p>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="What are the broader impacts of Where's Religion? in digital humanities?">
            <div className='space-y-4 text-slate-700'>
              <p className='leading-relaxed'>
                Being a tool that initiates engaged learning and in-person experience, at both the
                professional and amateur levels, we seek to build greater recognition of social
                dynamics and social context in human experience. The ethical use of technology and
                human subject research is key here.
              </p>
              <p className='leading-relaxed'>
                Where's Religion? is custom built using the most rigorous standard for open web
                design and shared data – Linked Open Data. This means that our app is available on
                the Web; it is machine readable structured data; it is non-proprietary; it is
                published using open standards from the World Wide Web Consortium; and it all links
                to other Linked Open Data.
              </p>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Does Where's Religion? protect my intellectual labor?">
            <p className='leading-relaxed text-slate-700'>
              Every researcher chooses when and if to publish (and, if needed, unpublish) their
              Field Notes. Where's Religion? is designed to be a collaborative space to build
              knowledge and prompt new questions about religion in order to better understand what
              it is to be human, together.
            </p>
          </CollapsibleSection>

          <CollapsibleSection title="Who contributes to what I find on Where's Religion? (And are the Field Notes reliable?)">
            <div className='space-y-4 text-slate-700'>
              <p className='leading-relaxed'>
                Field Notes are created by trained researchers and students enrolled in
                college-level and graduate courses on religion, theology, and related fields. To
                ensure the integrity of accessible content, published content is subject to peer
                review and, if necessary, administrative unpublishing.
              </p>
              <p className='leading-relaxed'>
                You do not need to have a research profile to access published notes and
                visualizations.
              </p>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title='What if I want to unpublish a Field Note?'>
            <p className='leading-relaxed text-slate-700'>
              All researchers have the ability to publish and unpublish Field Notes in the mobile
              app by toggling the "Upload" icon on the top right corner of the Field Note interface.
              From My Entries, users can swipe right on a preview to toggle publish and unpublish.
            </p>
          </CollapsibleSection>

          <CollapsibleSection title='How do I create good media?'>
            <p className='leading-relaxed text-slate-700'>
              Where's Religion? began with the conviction that "religion" is lived in myriad ways
              beyond the worlds of texts. While photographs, sound recordings, and video are also
              highly mediated forms of research materials, they can nevertheless offer different
              insights into the lived worlds of religion, culture, and society. And in today's
              highly digital information ecosystems, visual and aural media is even more important.
            </p>
          </CollapsibleSection>

          <CollapsibleSection title='What is human subject research?'>
            <div className='space-y-4 text-slate-700'>
              <p className='leading-relaxed'>
                Modern definitions of human subject research extend from the 1974 National Research
                Act, which sought to establish baselines of ethical biomedical and behavioral
                research in the United States. Human subject research is research that involves
                interventions with living humans for the purpose of advancing generalizable
                knowledge. The Belmont Report (1979) provides a summary of definitions and basic
                ethical principles of human subject research.
              </p>
              <p className='leading-relaxed'>
                Ethnographic and sociological studies of religion are often classified as behavioral
                research and often require forms of authorization and consent. However, studies that
                are not generalizable (case studies and oral histories, for example) may not fall
                into the official classification of human subject research. It is the responsibility
                of Where's Religion? users to determine whether their project requires institutional
                authorization and, if so, to receive required authorizations from their institutions
                before using this app.
              </p>
            </div>
          </CollapsibleSection>
        </section>

        {/* Back to top button */}
        <div className='mt-12 text-center'>
          <Link href='/#aboutSection'>
            <Button
              variant='outline'
              size='lg'
              className='rounded-xl border-2 border-blue-300 bg-white transition-all duration-200 hover:scale-105 hover:border-blue-400 hover:bg-white hover:text-slate-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2'
            >
              ← Back to About
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
