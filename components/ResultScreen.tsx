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
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [heatmapData, setHeatmapData] = useState<number[][]>([])
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showHeatmap && uploadedImageUrl && imageRef.current) {
      const img = imageRef.current
      
      const generateHeatmap = () => {
        const imgWidth = img.offsetWidth || img.clientWidth
        const imgHeight = img.offsetHeight || img.clientHeight
        
        // Create grid - adjust cell size based on image size
        const cellSize = Math.max(20, Math.min(40, Math.floor(imgWidth / 25)))
        const cols = Math.ceil(imgWidth / cellSize)
        const rows = Math.ceil(imgHeight / cellSize)
        
        // Generate random heat values (0-1) for each cell
        const grid: number[][] = []
        for (let row = 0; row < rows; row++) {
          const rowData: number[] = []
          for (let col = 0; col < cols; col++) {
            // Higher values near pin if it exists
            let value = Math.random()
            if (pinCoordinates) {
              const cellX = col * cellSize + cellSize / 2
              const cellY = row * cellSize + cellSize / 2
              const distX = Math.abs(cellX - pinCoordinates.x)
              const distY = Math.abs(cellY - pinCoordinates.y)
              const distance = Math.sqrt(distX * distX + distY * distY)
              const maxDist = Math.sqrt(imgWidth * imgWidth + imgHeight * imgHeight)
              // Closer to pin = higher value, but still random
              const proximityBonus = 1 - (distance / maxDist) * 0.5
              value = Math.min(1, value * 0.7 + proximityBonus * 0.3)
            }
            rowData.push(value)
          }
          grid.push(rowData)
        }
        
        setHeatmapData(grid)
      }

      if (img.complete && img.naturalWidth > 0) {
        generateHeatmap()
      } else {
        img.onload = generateHeatmap
        setTimeout(generateHeatmap, 100)
      }
    }
  }, [showHeatmap, uploadedImageUrl, pinCoordinates])

  const handleShowRoute = () => {
    setShowHeatmap(true)
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

            {/* Show heatmap button */}
            {uploadedImageUrl && !showHeatmap && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={handleShowRoute}
                className="px-6 sm:px-8 py-2 sm:py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/80 hover:text-white text-sm sm:text-base transition-all"
              >
                Click to see the heatmap
              </motion.button>
            )}

            {/* Heatmap visualization */}
            <AnimatePresence>
              {showHeatmap && uploadedImageUrl && heatmapData.length > 0 && (
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
                      alt="Heatmap visualization"
                      className="w-full h-auto block rounded"
                    />
                    {/* Heatmap grid overlay */}
                    {imageRef.current && (
                      <div
                        className="absolute top-2 sm:top-4 left-2 sm:left-4 pointer-events-none"
                        style={{
                          width: imageRef.current.offsetWidth || '100%',
                          height: imageRef.current.offsetHeight || '100%',
                        }}
                      >
                        {heatmapData.map((row, rowIdx) =>
                          row.map((value, colIdx) => {
                            const cellSize = Math.max(20, Math.min(40, Math.floor((imageRef.current?.offsetWidth || 500) / 25)))
                            const opacity = value
                            const intensity = Math.floor(value * 255)
                            
                            return (
                              <motion.div
                                key={`${rowIdx}-${colIdx}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity }}
                                transition={{ duration: 0.3, delay: (rowIdx + colIdx) * 0.01 }}
                                className="absolute"
                                style={{
                                  left: `${colIdx * cellSize}px`,
                                  top: `${rowIdx * cellSize}px`,
                                  width: `${cellSize}px`,
                                  height: `${cellSize}px`,
                                  backgroundColor: `rgba(255, ${255 - intensity}, ${255 - intensity}, ${opacity * 0.6})`,
                                  border: '0.5px solid rgba(255, 0, 0, 0.1)',
                                }}
                              />
                            )
                          })
                        )}
                      </div>
                    )}
                    
                    {/* Legend */}
                    <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="h-3 w-8 bg-red-900 rounded"></div>
                          <div className="h-3 w-8 bg-red-600 rounded"></div>
                          <div className="h-3 w-8 bg-red-300 rounded"></div>
                        </div>
                        <p className="text-xs sm:text-sm text-white/80 font-medium max-w-[120px]">
                          Darker red = Higher chance
                        </p>
                      </div>
                    </div>
                    
                    {/* Pin marker if exists */}
                    {pinCoordinates && (
                      <div
                        className="absolute pointer-events-none z-10"
                        style={{
                          left: `${pinCoordinates.x}px`,
                          top: `${pinCoordinates.y}px`,
                          transform: 'translate(-50%, -100%)',
                        }}
                      >
                        <div className="w-6 h-6 bg-accent rounded-full border-2 border-white shadow-lg" />
                        <div className="w-1 h-8 bg-accent mx-auto mt-0.5" />
                      </div>
                    )}
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

