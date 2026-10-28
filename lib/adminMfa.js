export function tokenAal(token) {
  try {
    const payload = String(token || '').split('.')[1]
    if (!payload) return null
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return claims?.aal || null
  } catch {
    return null
  }
}

export function tokenHasMfa(token) {
  return tokenAal(token) === 'aal2'
}
