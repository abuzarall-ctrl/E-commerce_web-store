'use client'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

// Minimal, cloth-only hero background.
// - Shows /videos/clothes-loop.mp4 when a cloth-only clip is provided (progressive enhancement).
// - Otherwise renders a clean animated fabric scene built from garment silhouettes only:
//   no people, no living things, no props — just clothes.
const GARMENTS = [
  {
    id: 'tee',
    cls: 'garment garment--tee',
    viewBox: '0 0 64 64',
    paths: [
      'M25 15 L18 9 L7 15 L13 23 L20 19 L20 57 L44 57 L44 19 L51 23 L57 15 L46 9 L39 15 C37 12 35 11 32 11 C29 11 27 12 25 15 Z',
    ],
  },
  {
    id: 'kurta',
    cls: 'garment garment--kurta',
    viewBox: '0 0 64 64',
    paths: [
      'M27 9 C29 6 35 6 37 9 L45 13 L49 17 L47 21 L43 20 L43 57 L21 57 L21 20 L17 21 L15 17 L19 13 Z',
      'M32 9 L32 16',
    ],
  },
  {
    id: 'trousers',
    cls: 'garment garment--trousers',
    viewBox: '0 0 64 64',
    paths: [
      'M21 8 L43 8 L45 57 L37 57 L34 31 L30 31 L27 57 L19 57 Z',
    ],
  },
  {
    id: 'shirt',
    cls: 'garment garment--shirt',
    viewBox: '0 0 64 64',
    paths: [
      'M24 11 L32 16 L40 11 L47 16 L45 21 L41 20 L41 57 L23 57 L23 20 L19 21 L17 16 Z',
      'M26 11 C28 8 36 8 38 11',
      'M28 27 L36 27 M28 33 L36 33 M28 39 L36 39',
    ],
  },
  {
    id: 'fabric',
    cls: 'garment garment--fabric',
    viewBox: '0 0 64 64',
    paths: [
      'M4 34 C14 22 22 46 32 34 C42 22 50 46 60 34',
      'M4 44 C14 32 22 56 32 44 C42 32 50 56 60 44',
    ],
  },
]

export default function HeroClothBackground() {
  const scope = useRef(null)
  const vidRef = useRef(null)
  const [videoFailed, setVideoFailed] = useState(false)

  useEffect(() => {
    const vid = vidRef.current
    if (vid && !videoFailed) vid.playbackRate = 0.7
  }, [videoFailed])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduced) return

      gsap.utils.toArray('.garment').forEach((el, i) => {
        gsap.to(el, {
          y: `random(-26, 26)`,
          x: `random(-18, 18)`,
          rotation: `random(-7, 7)`,
          duration: `random(13, 22)`,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 1.4,
        })
        gsap.fromTo(el, { opacity: 0.5 }, {
          opacity: 0.95,
          duration: 3,
          ease: 'power2.out',
          delay: i * 0.35,
        })
      })
    }, scope)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={scope} className="hero-cloth-scene" aria-hidden="true">
      {/* Cloth-only video (shown in both themes; falls back to garment scene if unavailable) */}
      {!videoFailed && (
        <video
          ref={vidRef}
          className="hero-video"
          playsInline
          muted
          loop
          autoPlay
          preload="auto"
          tabIndex={-1}
          onError={() => setVideoFailed(true)}>
          <source src="/videos/clothes-loop.mp4" type="video/mp4" />
        </video>
      )}

      {/* Fabric sheen + garment silhouettes (shown until/unless video plays) */}
      <div className="fabric-sheen" />
      <div className="garment-layer">
        {GARMENTS.map(g => (
          <svg
            key={g.id}
            className={g.cls}
            viewBox={g.viewBox}
            fill="none"
            style={{ display: 'block' }}>
            {g.paths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="rgba(212,163,115,0.05)"
                stroke="rgba(212,163,115,0.30)"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        ))}
      </div>

      {/* Readability overlay */}
      <div className="hero-overlay" />
    </div>
  )
}
