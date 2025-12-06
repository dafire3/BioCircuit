'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

interface ResultScreenProps {
  trainingStarted: boolean
  trainingScore: number | null
  answers: Record<string, string>
  uploadedImageUrl: string | null
  pinCoordinates: { x: number; y: number } | null
  onRestart: () => void
}

const QUESTION_LABELS: Record<string, string> = {
  'river-distance': 'Nearest river distance',
  'settlement-age': 'Settlement age',
  'sediment-topology': 'Sediment/topology',
  'vegetation-edible': 'Vegetation edibility',
  'start-training': 'Training decision',
}

export default function ResultScreen({
  trainingStarted,
  trainingScore,
  answers,
  uploadedImageUrl,
  pinCoordinates,
  onRestart,
}: ResultScreenProps) {
  const [showRoute, setShowRoute] = useState(false)
  const [endPoint, setEndPoint] = useState<{ x: number; y: number } | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showRoute && uploadedImageUrl && pinCoordinates && imageRef.current) {
      const img = imageRef.current
      
      const calculateRoute = () => {
        const imgRect = img.getBoundingClientRect()
        
        // Calculate random edge point relative to image
        const edges = [
          { x: 0, y: Math.random() * imgRect.height }, // Left edge
          { x: imgRect.width, y: Math.random() * imgRect.height }, // Right edge
          { x: Math.random() * imgRect.width, y: 0 }, // Top edge
          { x: Math.random() * imgRect.width, y: imgRect.height }, // Bottom edge
        ]
        const selectedEdge = edges[Math.floor(Math.random() * edges.length)]
        
        setEndPoint(selectedEdge)
      }

      if (img.complete && img.naturalWidth > 0) {
        calculateRoute()
      } else {
        img.onload = calculateRoute
        // Fallback in case onload doesn't fire
        setTimeout(calculateRoute, 100)
      }
    }
  }, [showRoute, uploadedImageUrl, pinCoordinates])

  const handleShowRoute = () => {
    setShowRoute(true)
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-20"
    >
      <div className="max-w-3xl w-full space-y-8 sm:space-y-12 md:space-y-16 text-center">
        {trainingStarted && trainingScore !== null ? (
          <>
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl md:text-4xl font-light text-white/80 px-4"
            >
              Prototype AI estimate
            </motion.h1>

            {/* Percentage */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white"
            >
              {trainingScore}%
            </motion.div>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm sm:text-base text-white/60 -mt-4"
            >
              {trainingScore}% you would find an archaeological settlement if you follow the given route
            </motion.p>

            {/* Show route button */}
            {uploadedImageUrl && pinCoordinates && !showRoute && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={handleShowRoute}
                className="px-6 sm:px-8 py-2 sm:py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/80 hover:text-white text-sm sm:text-base transition-all"
              >
                Click to see the route
              </motion.button>
            )}

            {/* Route visualization */}
            <AnimatePresence>
              {showRoute && uploadedImageUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="w-full max-w-4xl mx-auto mt-8"
                >
                  <div 
                    ref={containerRef}
                    className="relative border-2 border-white/20 rounded-lg p-2 sm:p-4 bg-black/10 overflow-hidden"
                  >
                    <img
                      ref={imageRef}
                      src={uploadedImageUrl}
                      alt="Route visualization"
                      className="w-full h-auto block rounded"
                      onLoad={() => {
                        // Recalculate route when image loads
                        if (pinCoordinates && imageRef.current) {
                          const img = imageRef.current
                          const imgRect = img.getBoundingClientRect()
                          const edges = [
                            { x: 0, y: Math.random() * imgRect.height },
                            { x: imgRect.width, y: Math.random() * imgRect.height },
                            { x: Math.random() * imgRect.width, y: 0 },
                            { x: Math.random() * imgRect.width, y: imgRect.height },
                          ]
                          setEndPoint(edges[Math.floor(Math.random() * edges.length)])
                        }
                      }}
                    />
                    {/* SVG overlay for route */}
                    {pinCoordinates && endPoint && imageRef.current && (() => {
                      const startX = pinCoordinates.x
                      const startY = pinCoordinates.y
                      const endX = endPoint.x
                      const endY = endPoint.y
                      
                      // Create 1-2 subtle turning points
                      const numTurns = 1 + Math.floor(Math.random() * 2) // 1 or 2 turns
                      const turns: { x: number; y: number }[] = []
                      
                      for (let i = 0; i < numTurns; i++) {
                        const t = 0.3 + (i + 1) * (0.4 / (numTurns + 1)) // Distribute turns along path
                        const baseX = startX + (endX - startX) * t
                        const baseY = startY + (endY - startY) * t
                        
                        // Subtle offset perpendicular to the path direction
                        const dx = endX - startX
                        const dy = endY - startY
                        const length = Math.sqrt(dx * dx + dy * dy)
                        const perpX = -dy / length
                        const perpY = dx / length
                        
                        // Small offset (15-30px) for realistic turn
                        const offset = 15 + Math.random() * 15
                        const offsetX = perpX * offset * (Math.random() > 0.5 ? 1 : -1)
                        const offsetY = perpY * offset * (Math.random() > 0.5 ? 1 : -1)
                        
                        turns.push({
                          x: baseX + offsetX,
                          y: baseY + offsetY,
                        })
                      }
                      
                      // Build smooth path with turns
                      let path = `M ${startX} ${startY}`
                      
                      if (turns.length === 1) {
                        // Single turn - use quadratic curve
                        path += ` Q ${turns[0].x} ${turns[0].y} ${endX} ${endY}`
                      } else if (turns.length === 2) {
                        // Two turns - use smooth cubic bezier
                        const midX = (turns[0].x + turns[1].x) / 2
                        const midY = (turns[0].y + turns[1].y) / 2
                        path += ` Q ${turns[0].x} ${turns[0].y} ${midX} ${midY}`
                        path += ` Q ${turns[1].x} ${turns[1].y} ${endX} ${endY}`
                      } else {
                        // Fallback - straight line with slight curve
                        const midX = (startX + endX) / 2
                        const midY = (startY + endY) / 2
                        path += ` Q ${midX} ${midY} ${endX} ${endY}`
                      }
                      
                      return (
                        <svg
                          className="absolute top-2 sm:top-4 left-2 sm:left-4 pointer-events-none"
                          width={imageRef.current.offsetWidth}
                          height={imageRef.current.offsetHeight}
                          style={{ 
                            width: imageRef.current.offsetWidth || '100%', 
                            height: imageRef.current.offsetHeight || '100%' 
                          }}
                        >
                          <defs>
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                              <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                          </defs>
                          
                          {/* Main path */}
                          <motion.path
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, ease: 'easeInOut' }}
                            d={path}
                            stroke="#FF2BA1"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            filter="url(#glow)"
                          />
                          
                          {/* Start pin */}
                          <circle
                            cx={startX}
                            cy={startY}
                            r="6"
                            fill="#FF2BA1"
                            stroke="#FFFFFF"
                            strokeWidth="1.5"
                            filter="url(#glow)"
                          />
                          
                          {/* End point */}
                          <motion.circle
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1.5, type: 'spring' }}
                            cx={endX}
                            cy={endY}
                            r="8"
                            fill="#FFC738"
                            stroke="#FFFFFF"
                            strokeWidth="1.5"
                            filter="url(#glow)"
                          />
                        </svg>
                      )
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 sm:mt-12 md:mt-16 space-y-3 sm:space-y-4 text-left max-w-xl mx-auto px-4"
            >
              <h3 className="text-base sm:text-lg font-semibold text-white/60 mb-4 sm:mb-6 text-center">
                Your responses
              </h3>
              {Object.entries(answers)
                .filter(([key]) => key !== 'start-training')
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="py-2 sm:py-3 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0"
                  >
                    <span className="text-white/50 text-xs sm:text-sm">
                      {QUESTION_LABELS[key] || key}
                    </span>
                    <span className="text-white/80 text-xs sm:text-sm text-left sm:text-right sm:ml-4 break-words">
                      {value}
                    </span>
                  </div>
                ))}
            </motion.div>
          </>
        ) : (
          <>
            {/* Declined message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4 sm:space-y-6 px-4"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-white">
                Maybe another time 🙂
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/60 max-w-xl mx-auto">
                You can always upload another map and explore potential routes when you're ready.
              </p>
            </motion.div>

            {/* Restart button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onClick={onRestart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 sm:px-12 py-3 sm:py-4 bg-accent text-white text-sm sm:text-base font-semibold rounded-lg transition-all hover:scale-105 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            >
              Restart
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  )
}

