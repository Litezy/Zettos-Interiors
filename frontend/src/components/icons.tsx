import type { ReactNode } from 'react'

type SiteIconName =
  'arrow-up-right' | 'arrow-up' | 'arrow-down' | 'refresh' | 'search' | 'close'

export function SiteIcon({ name }: { name: SiteIconName }) {
  let icon: ReactNode

  switch (name) {
    case 'arrow-up-right':
      icon = <path d="M7 17 17 7M7 7h10v10" />
      break
    case 'arrow-up':
      icon = <path d="M12 19V5m-7 7 7-7 7 7" />
      break
    case 'arrow-down':
      icon = <path d="M12 5v14m7-7-7 7-7-7" />
      break
    case 'refresh':
      icon = (
        <>
          <path d="M20 7v5h-5" />
          <path d="M19 12a7 7 0 0 0-12-4L5 10" />
          <path d="M4 17v-5h5" />
          <path d="M5 12a7 7 0 0 0 12 4l2-2" />
        </>
      )
      break
    case 'search':
      icon = (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 5 5" />
        </>
      )
      break
    case 'close':
      icon = <path d="m6 6 12 12M18 6 6 18" />
      break
  }

  return (
    <svg
      className="ui-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {icon}
    </svg>
  )
}
