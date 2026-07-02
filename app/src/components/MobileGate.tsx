import { type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function MobileGate({ children }: Props) {
  return (
    <>
      {/* Mobile/tablet blocking screen — hidden on desktop via CSS */}
      <div className="mobile-gate">
        <div className="mobile-gate__inner">
          <span className="mobile-gate__wordmark">TX-04</span>
          <p className="mobile-gate__message">
            This instrument is designed for desktop.
          </p>
          <p className="mobile-gate__sub">
            Open it on a laptop or desktop computer to play.
          </p>
        </div>
      </div>

      {/* Desktop content — hidden on mobile/tablet via CSS */}
      <div className="desktop-only">
        {children}
      </div>
    </>
  )
}
