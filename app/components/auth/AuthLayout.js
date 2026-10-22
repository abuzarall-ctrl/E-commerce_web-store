// Shared shell for every AbuzarStore auth page.
// variant="admin" swaps the visual panel to a charcoal tone for the admin portal.
import { FiShield } from 'react-icons/fi'

const PLATE = 'M50 14a36 36 0 1 0 0 72a36 36 0 1 0 0-72Zm0 12a24 24 0 1 1 0 48a24 24 0 1 1 0-48Z'
const MUG = 'M20 28h46v40a14 14 0 0 1-14 14H34a14 14 0 0 1-14-14Z M66 36h8a11 11 0 0 1 0 22h-8'
const BOWL = 'M16 48h68c-3 20-15 32-34 32S19 68 16 48Z M12 48h76'

const SHAPES = [PLATE, MUG, BOWL]

export default function AuthLayout({ variant = 'customer', children }) {
  const isAdmin = variant === 'admin'
  return (
    <div className="auth-page">
      {/* Subtle line-art panel (desktop only) */}
      <aside className={`auth-visual ${isAdmin ? 'auth-visual--admin' : ''}`}>
        <div className="auth-visual-brand">
          Abuzar<span>Store</span>
        </div>

        <div className="auth-visual-art">
          {SHAPES.map((d, i) => (
            <div key={i} className={`auth-garment auth-garment--${i + 1}`}>
              <svg viewBox="0 0 100 100" fill="none" stroke={isAdmin ? '#D4A373' : '#A9773F'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d={d} />
              </svg>
            </div>
          ))}
        </div>

        <div>
          <p className="auth-visual-eyebrow">
            {isAdmin ? 'AbuzarStore · Admin' : 'AbuzarStore'}
          </p>
          <p className="auth-visual-tagline">
            {isAdmin ? (
              <>Manage your store <b>securely.</b></>
            ) : (
              <>Everyday crockery, <b>made to be used.</b></>
            )}
          </p>
          {isAdmin && (
            <p className="auth-visual-note">
              Authorized staff only. Your session is protected.
            </p>
          )}
        </div>
      </aside>

      {/* Form column */}
      <main className="auth-main">
        <div className="auth-shell">
          <div className="auth-brand">
            Abuzar<span>Store</span>
          </div>
          {isAdmin && (
            <div className="auth-badge">
              <FiShield size={10} style={{ marginRight: '5px', verticalAlign: '-1px' }} />
              Admin Portal
            </div>
          )}
          <div className="auth-card">{children}</div>
        </div>
        <div className="auth-foot">Serving Pakistan with care</div>
      </main>
    </div>
  )
}