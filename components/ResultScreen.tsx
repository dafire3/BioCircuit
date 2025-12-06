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
                      // Generate multiple squiggly paths
                      const generateSquigglyPath = (startX: number, startY: number, endX: number, endY: number) => {
                        const numPoints = 15 + Math.floor(Math.random() * 10) // 15-25 points
                        const points: { x: number; y: number }[] = []
                        
                        // Start point
                        points.push({ x: startX, y: startY })
                        
                        // Generate intermediate points with randomness
                        for (let i = 1; i < numPoints - 1; i++) {
                          const t = i / (numPoints - 1)
                          const baseX = startX + (endX - startX) * t
                          const baseY = startY + (endY - startY) * t
                          
                          // Add random offset for squiggles
                          const offsetX = (Math.random() - 0.5) * 60
                          const offsetY = (Math.random() - 0.5) * 60
                          
                          points.push({
                            x: baseX + offsetX,
                            y: baseY + offsetY,
                          })
                        }
                        
                        // End point
                        points.push({ x: endX, y: endY })
                        
                        // Create smooth path using quadratic curves
                        let path = `M ${points[0].x} ${points[0].y}`
                        for (let i = 1; i < points.length; i++) {
                          const prev = points[i - 1]
                          const curr = points[i]
                          const next = points[i + 1] || curr
                          
                          const cpX = curr.x + (next.x - prev.x) * 0.2
                          const cpY = curr.y + (next.y - prev.y) * 0.2
                          
                          path += ` Q ${cpX} ${cpY} ${curr.x} ${curr.y}`
                        }
                        
                        return path
                      }
                      
                      const mainPath = generateSquigglyPath(pinCoordinates.x, pinCoordinates.y, endPoint.x, endPoint.y)
                      
                      // Generate 2-3 branch paths that fade out
                      const branches: string[] = []
                      for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
                        const branchStartT = 0.3 + Math.random() * 0.4 // Start somewhere in middle
                        const branchStartX = pinCoordinates.x + (endPoint.x - pinCoordinates.x) * branchStartT
                        const branchStartY = pinCoordinates.y + (endPoint.y - pinCoordinates.y) * branchStartT
                        
                        const branchEndX = branchStartX + (Math.random() - 0.5) * 150
                        const branchEndY = branchStartY + (Math.random() - 0.5) * 150
                        
                        branches.push(generateSquigglyPath(branchStartX, branchStartY, branchEndX, branchEndY))
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
                              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                              <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                          </defs>
                          
                          {/* Branch paths (fade out) */}
                          {branches.map((branchPath, idx) => (
                            <motion.path
                              key={`branch-${idx}`}
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ pathLength: 0.6 + Math.random() * 0.3, opacity: 0.3 }}
                              transition={{ duration: 1 + Math.random(), delay: 0.5 + idx * 0.3, ease: 'easeInOut' }}
                              d={branchPath}
                              stroke="#FF2BA1"
                              strokeWidth="1.5"
                              fill="none"
                              strokeLinecap="round"
                              strokeOpacity="0.4"
                            />
                          ))}
                          
                          {/* Main path */}
                          <motion.path
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: 'easeInOut' }}
                            d={mainPath}
                            stroke="#FF2BA1"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            filter="url(#glow)"
                          />
                          
                          {/* Start pin */}
                          <circle
                            cx={pinCoordinates.x}
                            cy={pinCoordinates.y}
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
                            transition={{ delay: 2, type: 'spring' }}
                            cx={endPoint.x}
                            cy={endPoint.y}
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

