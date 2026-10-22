'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings } from '@/lib/siteSettings'

const SiteSettingsContext = createContext(DEFAULT_SITE_SETTINGS)

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS)

  useEffect(() => {
    let active = true

    fetch('/api/site-settings', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then(result => {
        if (active && result?.settings) setSettings(normalizeSiteSettings(result.settings))
      })
      .catch(() => {})

    const handleUpdate = (event) => {
      setSettings(normalizeSiteSettings(event.detail))
    }

    window.addEventListener('site-settings-updated', handleUpdate)
    return () => {
      active = false
      window.removeEventListener('site-settings-updated', handleUpdate)
    }
  }, [])

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
