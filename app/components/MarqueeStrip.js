'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

const ITEMS = ['T-Shirts', 'Shalwar Kameez', 'Kurta', 'Shorts', 'Trousers']

export default function MarqueeStrip() {
  const trackRef = useRef(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const tween = gsap.to(track, {
      xPercent: -50,
      duration: 26,
      ease: 'none',
      repeat: -1,
    })

    const pause = () => tween.pause()
    const resume = () => tween.play()
    track.addEventListener('mouseenter', pause)
    track.addEventListener('mouseleave', resume)
    return () => {
      track.removeEventListener('mouseenter', pause)
      track.removeEventListener('mouseleave', resume)
      tween.kill()
    }
  }, [])

  const strip = (
    <span className="marquee-group">
      {ITEMS.map(item => (
        <span key={item} className="marquee-item">
          {item}
          <span className="marquee-dot" aria-hidden="true" />
        </span>
      ))}
    </span>
  )

  return (
    <div className="marquee-strip" aria-hidden="true">
      <div className="marquee-track" ref={trackRef}>
        {strip}
        {strip}
      </div>
    </div>
  )
}
