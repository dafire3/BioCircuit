'use client'

import { useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import Image from 'next/image'

interface IntroLogoProps {
  onComplete: () => void
}

export default function IntroLogo({ onComplete }: IntroLogoProps) {
  const [showCrack, setShowCrack] = useState(false)
  const logoControls = useAnimation()
  const containerControls = useAnimation()

  useEffect(() => {
    const sequence = async () => {
      // Faster drop from very top of screen to center
      await logoControls.start({
        y: 0, // End at center
        scale: [1, 1.15, 0.92, 1], // More pronounced squash on impact
        transition: {
          duration: 0.7, // Faster fall
          ease: [0.25, 0.46, 0.45, 0.94], // Smooth acceleration, slight bounce
        },
      })

      // Show crack effect on impact
      setShowCrack(true)

      // Screen shake on impact
      await containerControls.start({
        x: [0, -4, 4, -3, 3, 0],
        transition: {
          duration: 0.5,
        },
      })

      // Small settle bounce
      await logoControls.start({
        y: [0, -25, 0],
        scale: [1, 0.98, 1],
        transition: {
          duration: 0.4,
          ease: [0.34, 1.56, 0.64, 1],
        },
      })

      // Fade out
      await containerControls.start({
        opacity: 0,
        transition: {
          duration: 0.6,
        },
      })

      onComplete()
    }

    sequence()
  }, [logoControls, containerControls, onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background flex items-center justify-center overflow-hidden"
      animate={containerControls}
    >
      {/* Crack lines - 4 vertical lines going through the logo */}
      {showCrack && (
        <>
          {[0, 1, 2, 3].map((i) => {
            const rotations = [-2, 1, -1.5, 2] // Slight angles for realism
            const widths = [1, 1.2, 0.8, 1.1] // Varying width for realism
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{
                  opacity: [0, 0.9, 0.7, 0.5],
                  scaleY: [0, 1],
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.05,
                  ease: 'easeOut',
                }}
                className="absolute bg-white/60 origin-center"
                style={{
                  left: `calc(50% + ${(i - 1.5) * 30}px)`,
                  top: '0%',
                  bottom: '0%',
                  width: `${widths[i]}px`,
                  transform: `translateX(-50%) rotate(${rotations[i]}deg)`,
                  boxShadow: '0 0 2px rgba(255, 255, 255, 0.5)',
                }}
              />
            )
          })}
        </>
      )}

      {/* Logo in circle - starts from very top of screen */}
      <motion.div
        className="relative"
        initial={{ y: 'calc(-50vh - 200px)' }} // Start above viewport
        animate={logoControls}
      >
        <motion.div
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 sm:border-4 border-biogold flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Image
            src="/biocircuit-logo.png"
            alt="BioCircuit"
            width={96}
            height={96}
            className="w-16 h-16 sm:w-24 sm:h-24 object-contain"
            priority
          />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

