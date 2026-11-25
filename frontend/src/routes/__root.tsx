import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'
import adminCss from '../admin.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title:
          'Zettos Interior Units — Spaces that inspire. Structures that last.',
      },
      {
        name: 'theme-color',
        content: '#263d32',
      },
      {
        property: 'og:site_name',
        content: 'Zettos Interior Units',
      },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'stylesheet',
        href: adminCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
