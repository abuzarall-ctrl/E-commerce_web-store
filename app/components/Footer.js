export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
      padding: '48px 24px 24px',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '40px',
        marginBottom: '40px'
      }}>

        {/* Brand */}
        <div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: 'var(--accent)',
            marginBottom: '12px'
          }}>
            Abuzar<span style={{ color: 'var(--text-primary)' }}>Store</span>
          </h3>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-faint)',
            lineHeight: '1.7'
          }}>
            Pakistani clothing at its finest. Real quality, honest prices. Serving customers across Pakistan.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>Quick Links</h4>
          {['Shop', 'T-Shirts', 'Shalwar Kameez', 'Shorts', 'Trousers'].map(link => (
            <p key={link} style={{
              fontSize: '13px',
              color: 'var(--text-faint)',
              marginBottom: '8px',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
              onMouseEnter={e => e.target.style.color = 'var(--accent)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-faint)'}>
              {link}
            </p>
          ))}
        </div>

        {/* Contact */}
        <div>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>Contact</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '8px' }}>
            📍 Karachi, Pakistan
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '8px' }}>
            📞 +92 300 0000000
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '8px' }}>
            📧 support@abuzarstore.pk
          </p>
        </div>

        {/* Categories */}
        <div>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>Categories</h4>
          {['T-Shirts', 'Shalwar Kameez', 'Kurta', 'Shorts', 'Trousers'].map(cat => (
            <span key={cat} style={{
              display: 'inline-block',
              background: 'var(--bg-surface2)',
              color: 'var(--text-muted)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              margin: '0 4px 6px 0',
              border: '1px solid var(--border)',
              cursor: 'pointer'
            }}>{cat}</span>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        borderTop: '1px solid var(--border)',
        paddingTop: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
          © 2025 AbuzarStore. All rights reserved.
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
          Made with ❤️ in Pakistan
        </p>
      </div>
    </footer>
  )
}