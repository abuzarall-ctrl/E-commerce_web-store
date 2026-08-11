// Shared shell for every AbuzarStore auth page.
// variant="admin" swaps the visual panel to a charcoal tone for the admin portal.
import { FiShield } from 'react-icons/fi'

const TSHIRT = 'M28 14 L8 32 L22 38 L22 82 L78 82 L78 38 L92 32 L72 14 Q60 22 50 22 Q40 22 28 14 Z'
const TROUSER = 'M14 2 L86 2 L86 12 L68 12 L68 58 Q70 80 86 98 L56 98 L50 64 L44 98 L14 98 Q30 80 32 58 L32 12 Z'
const KURTA = 'M26 10 L4 32 L20 40 L20 96 L80 96 L80 40 L96 32 L74 10 Q62 20 50 20 Q38 20 26 10 Z'

const GARMENTS = [TSHIRT, TROUSER, KURTA]

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
          {GARMENTS.map((d, i) => (
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
              <>Premium Pakistani <b>clothing.</b></>
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
        <div className="auth-foot">Serving Pakistan with Pride</div>
      </main>
    </div>
  )
}