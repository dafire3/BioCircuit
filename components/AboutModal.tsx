'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-background border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
              {/* Header */}
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl sm:text-3xl font-semibold text-white">What is BioCircuit?</h2>
                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white transition-colors text-2xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              
              {/* Content */}
              <div className="px-6 py-6 sm:py-8 text-white/80 leading-relaxed">
                <p className="text-base sm:text-lg mb-4">
                  Ever wonder how a single-celled organism could help find ancient artifacts? Meet <span className="text-biogold font-semibold">slime mold</span>—nature's ultimate pathfinder.
                </p>
                
                <p className="text-base sm:text-lg mb-4">
                  When slime mold hunts for food, it spreads everywhere like an overenthusiastic explorer. But once it finds a snack? It's laser-focused—retracting all the dead ends and zeroing in on the best route. It's basically nature's GPS, but way cooler.
                </p>
                
                <p className="text-base sm:text-lg mb-4">
                  BioCircuit takes this brilliant strategy and applies it to archaeology. Upload a LiDAR scan or topographical map, answer a few questions about the area, and watch as our AI draws possible routes in every direction—just like slime mold exploring.
                </p>
                
                <p className="text-base sm:text-lg">
                  The AI then highlights the most efficient path and gives you a percentage chance of finding another artifact. But here's the fun part: when those route lines bend around certain areas on the map, archaeologists can spot patterns that might reveal hidden sites.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

