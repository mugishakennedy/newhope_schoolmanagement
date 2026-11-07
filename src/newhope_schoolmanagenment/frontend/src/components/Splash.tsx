export function Splash() {
  return (
    <div className="splash" role="status" aria-live="polite">
      <div className="splash-content">
        <span className="splash-logo">
          <img src="/favicon.png" alt="Newhope School logo" />
        </span>
        <p className="splash-caption">Newhope School Management</p>
        <div className="splash-loader">
          <span />
        </div>
        <p className="splash-status">Preparing your portal</p>
      </div>
    </div>
  )
}
