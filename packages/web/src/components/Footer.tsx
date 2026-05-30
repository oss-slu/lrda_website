import { Link } from '@tanstack/react-router';
import { IconLink } from './IconLink';

const NAV_LINKS = [
  { to: '/map', label: 'Map' },
  { to: '/stories', label: 'Stories' },
  { to: '/resources', label: 'Resources' },
  { to: '/wheres-religion', label: 'About' },
] as const;

export default function Footer() {
  return (
    <footer className='border-t border-gray-200 bg-gray-50'>
      <div className='mx-auto max-w-7xl px-6 py-12 lg:px-8'>
        <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          {/* Brand */}
          <div className='space-y-3'>
            <Link to='/' className='text-lg font-bold text-gray-900'>
              Where&apos;s Religion?
            </Link>
            <p className='text-sm leading-relaxed text-gray-600'>
              Advancing the study of religion and public life through rigorous scholarly methods.
            </p>
            <p className='text-sm text-gray-500'>
              Saint Louis University
              <br />
              Center on Lived Religion
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className='mb-3 text-sm font-semibold tracking-wide text-gray-900 uppercase'>
              Navigate
            </h3>
            <ul className='space-y-2'>
              {NAV_LINKS.map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className='text-sm text-gray-600 transition-colors hover:text-gray-900'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className='mb-3 text-sm font-semibold tracking-wide text-gray-900 uppercase'>
              Connect
            </h3>
            <ul className='space-y-2'>
              <li>
                <a
                  href='https://religioninplace.org'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-sm text-gray-600 transition-colors hover:text-gray-900'
                >
                  religioninplace.org
                </a>
              </li>
            </ul>
            <div className='mt-4 flex gap-2'>
              <IconLink
                icon='instagram'
                href='https://www.instagram.com/livedreligion/'
                label='Visit Instagram'
              />
              <IconLink
                icon='twitterX'
                href='https://twitter.com/livedreligion'
                label='Visit Twitter/X'
              />
              <IconLink
                icon='github'
                href='https://github.com/oss-slu/lrda_website'
                label='Visit GitHub'
              />
            </div>
          </div>

          {/* App Downloads */}
          <div>
            <h3 className='mb-3 text-sm font-semibold tracking-wide text-gray-900 uppercase'>
              Get the App
            </h3>
            <div className='flex flex-col gap-3'>
              <a
                href='https://apps.apple.com/us/app/wheres-religion/id6469009793'
                target='_blank'
                rel='noopener noreferrer'
                aria-label='Get the app on the Apple App Store'
              >
                <img
                  src='/app_store_img.svg'
                  alt='Apple App Store'
                  style={{ height: 40, width: 'auto' }}
                />
              </a>
              <a
                href='https://play.google.com/store/apps/details?id=register.edu.slu.cs.oss.lrda&pcampaignid=web_share'
                target='_blank'
                rel='noopener noreferrer'
                aria-label='Get the app on Google Play'
              >
                <img
                  src='/01googleplay.svg'
                  alt='Google Play Store'
                  style={{ height: 40, width: 'auto' }}
                />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className='mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-500'>
          <p>
            Funded by the Henry Luce Foundation. Built by the Center on Lived Religion at Saint
            Louis University.
          </p>
        </div>
      </div>
    </footer>
  );
}
