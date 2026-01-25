'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { LatLngLiteral, Map as LeafletMap } from 'leaflet'

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false })
const CircleMarker = dynamic(() => import('react-leaflet').then((m) => m.CircleMarker), { ssr: false })

interface ResultScreenProps {
  trainingStarted: boolean
  trainingScore: number | null
  answers: Record<string, string>
  mapView: { center: LatLngLiteral; zoom: number } | null
  pinCoordinates: LatLngLiteral | null
  onRestart: () => void
}

const QUESTION_LABELS: Record<string, string> = {
  'river-distance': 'Nearest river distance',
  'settlement-age': 'Settlement age',
  'sediment-topology': 'Sediment/topology',
  'vegetation-edible': 'Vegetation edibility',
  'start-training': 'Training decision',
}

const DEFAULT_CENTER: LatLngLiteral = { lat: 39.8283, lng: -98.5795 }
const DEFAULT_ZOOM = 4

/**
 * ============================================================================
 * SLIME MOLD POLE SIMULATION COMPONENT
 * ============================================================================
 * 
 * This component simulates how slime mold (Physarum polycephalum) finds the
 * most efficient path when exploring its environment.
 * 
 * HOW SLIME MOLD WORKS IN NATURE:
 * - Slime mold is a single-celled organism that spreads in ALL directions
 *   when searching for food
 * - Once it finds the optimal path, it RETRACTS from inefficient routes
 *   and focuses all its mass on the best path
 * - This behavior inspired algorithms used in network optimization!
 * 
 * HOW THIS SIMULATION WORKS:
 * 1. Two poles are displayed at different angles (forming a V-shape)
 * 2. The slime mold starts at the base and explores BOTH poles simultaneously
 * 3. After climbing 25% of each pole, it evaluates which path is easier
 * 4. The slime then commits fully to the easier path (higher angle = less steep)
 *    while retracting from the harder path
 * 
 * WHY HIGHER ANGLE = EASIER CLIMB:
 * - A vertical pole (0°) would be the hardest to climb (straight up)
 * - A more tilted pole (45°) is easier because it's closer to horizontal
 * - The slime mold naturally chooses the path of least resistance
 * 
 * ============================================================================
 */
function SlimeMoldSimulation() {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────
  
  // Angles for each pole (in degrees). Left pole uses negative angle to lean left.
  const [leftAngle, setLeftAngle] = useState(0)
  const [rightAngle, setRightAngle] = useState(0)
  
  // Animation phases: idle → climbing → choosing → done
  // - idle: Waiting to start
  // - climbing: Slime explores both poles up to 25%
  // - choosing: Slime commits to easier pole, retracts from harder one
  // - done: Animation complete, show results
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'climbing' | 'choosing' | 'done'>('idle')
  
  // Progress of slime on each pole (0-100%)
  const [slimePositions, setSlimePositions] = useState({ left: 0, right: 0 })
  
  // Which pole the slime will choose (determined by angle comparison)
  const [chosenPole, setChosenPole] = useState<'left' | 'right' | null>(null)
  
  // Prevents re-randomizing angles on restart
  const [isInitialized, setIsInitialized] = useState(false)

  // ─────────────────────────────────────────────────────────────────────────
  // CONSTANTS
  // ─────────────────────────────────────────────────────────────────────────
  
  const POLE_LENGTH = 180 // Length of each pole in pixels
  const POLE_GAP = 150    // Horizontal distance between pole bases in pixels
  const SLIME_RADIUS = 12 // Base radius of slime blob in pixels

  // Predefined "cool" angles that create visually dramatic differences
  // These are carefully chosen to be distinct and easy to compare
  const COOL_ANGLES = [15, 22, 30, 38, 45]

  // ─────────────────────────────────────────────────────────────────────────
  // INITIALIZATION - Generate random angles (runs once on mount)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) {
      // Shuffle the cool angles array and pick the first two
      // This ensures we always get two DIFFERENT angles
      const shuffled = [...COOL_ANGLES].sort(() => Math.random() - 0.5)
      const leftA = shuffled[0]
      const rightA = shuffled[1]
      
      // Left pole leans LEFT (negative angle in our coordinate system)
      // Right pole leans RIGHT (positive angle)
      // This creates a V-shape opening outward
      setLeftAngle(-leftA)
      setRightAngle(rightA)

      // DECISION LOGIC: Higher angle = more tilted = less steep = easier to climb
      // The slime mold will choose the pole with the HIGHER angle
      setChosenPole(leftA >= rightA ? 'left' : 'right')
      
      setIsInitialized(true)
    }
  }, [isInitialized])

  // ─────────────────────────────────────────────────────────────────────────
  // START ANIMATION - Triggered after initialization
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitialized && animationPhase === 'idle') {
      // Wait 1 second before starting the climbing animation
      // This gives the user time to see the initial state
      const timer = setTimeout(() => {
        setAnimationPhase('climbing')
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isInitialized, animationPhase])

  // ─────────────────────────────────────────────────────────────────────────
  // RESTART FUNCTION - Replays animation with SAME angles
  // ─────────────────────────────────────────────────────────────────────────
  const handleRestart = () => {
    // Reset slime positions to starting point
    setSlimePositions({ left: 0, right: 0 })
    // Go back to idle phase (will trigger climbing after 1 second)
    setAnimationPhase('idle')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 1: CLIMBING - Slime explores both poles simultaneously
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (animationPhase === 'climbing') {
      // Animate slime climbing both poles until reaching 25%
      // This simulates the slime mold's initial exploration phase
      const interval = setInterval(() => {
        setSlimePositions((prev) => {
          // Increment both positions by 0.8% per tick (slow, visible movement)
          const newLeft = Math.min(prev.left + 0.8, 25)
          const newRight = Math.min(prev.right + 0.8, 25)
          
          // Once both reach 25%, stop and transition to choosing phase
          if (newLeft >= 25 && newRight >= 25) {
            clearInterval(interval)
            // Wait 800ms before starting the choosing phase
            // This pause lets the user see that both paths were explored equally
            setTimeout(() => setAnimationPhase('choosing'), 800)
          }
          
          return { left: newLeft, right: newRight }
        })
      }, 60) // Run every 60ms for smooth animation
      
      return () => clearInterval(interval)
    }
  }, [animationPhase])

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 2: CHOOSING - Slime commits to easier pole, retracts from harder
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (animationPhase === 'choosing') {
      // Simultaneously:
      // - Advance the slime on the chosen (easier) pole toward 100%
      // - Retract the slime from the rejected pole back to 0%
      const interval = setInterval(() => {
        setSlimePositions((prev) => {
          // Get current progress on each pole based on which was chosen
          const chosenProgress = chosenPole === 'left' ? prev.left : prev.right
          const otherProgress = chosenPole === 'left' ? prev.right : prev.left

          // Move forward on chosen pole (+1.2% per tick)
          // Retract from rejected pole (-1.5% per tick, slightly faster)
          let newChosen = Math.min(chosenProgress + 1.2, 100)
          let newOther = Math.max(otherProgress - 1.5, 0)

          // Animation complete when chosen reaches top and other fully retracted
          if (newChosen >= 100 && newOther <= 0) {
            clearInterval(interval)
            // Wait 500ms before showing final "done" state
            setTimeout(() => setAnimationPhase('done'), 500)
          }

          // Return updated positions in the correct order
          return chosenPole === 'left'
            ? { left: newChosen, right: newOther }
            : { left: newOther, right: newChosen }
        })
      }, 50) // Run every 50ms for smooth animation
      
      return () => clearInterval(interval)
    }
  }, [animationPhase, chosenPole])

  // ─────────────────────────────────────────────────────────────────────────
  // GEOMETRY CALCULATIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * Calculate the endpoint of a pole given its angle
   * Uses trigonometry to convert angle + length into x,y coordinates
   * 
   * @param angle - Angle in degrees (negative = lean left, positive = lean right)
   * @returns {x, y} - Endpoint position relative to the pole's base
   */
  const getPoleEnd = (angle: number) => {
    const radians = (angle * Math.PI) / 180
    return {
      x: Math.sin(radians) * POLE_LENGTH,        // Horizontal offset
      y: -Math.cos(radians) * POLE_LENGTH,       // Vertical offset (negative because SVG Y-axis is inverted)
    }
  }

  /**
   * Calculate the position of slime on a pole at a given progress percentage
   * 
   * @param angle - Angle of the pole in degrees
   * @param progress - How far up the pole (0-100%)
   * @returns {x, y} - Position of slime blob relative to pole base
   */
  const getSlimePos = (angle: number, progress: number) => {
    const radians = (angle * Math.PI) / 180
    const distance = (progress / 100) * POLE_LENGTH
    return {
      x: Math.sin(radians) * distance,
      y: -Math.cos(radians) * distance,
    }
  }

  // Pre-calculate pole endpoints and current slime positions
  const leftPoleEnd = getPoleEnd(leftAngle)
  const rightPoleEnd = getPoleEnd(rightAngle)
  const leftSlimePos = getSlimePos(leftAngle, slimePositions.left)
  const rightSlimePos = getSlimePos(rightAngle, slimePositions.right)

  // SVG coordinate system constants
  const centerX = 200  // Horizontal center of the SVG
  const baseY = 220    // Y-coordinate of the ground line (where poles start)

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER - SVG Visualization
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-full max-w-md mx-auto mt-8 sm:mt-12"
    >
      <h3 className="text-center text-white/60 text-sm sm:text-base mb-4 font-medium">
        Slime Mold Path Selection
      </h3>
      <div className="relative bg-black/20 border border-white/10 rounded-xl p-4">
        {/* 
          SVG Canvas - 400x260 viewBox
          The viewBox scales responsively while maintaining aspect ratio
        */}
        <svg
          viewBox="0 0 400 260"
          className="w-full h-auto"
          style={{ maxHeight: '300px' }}
        >
          {/* ─────────────────────────────────────────────────────────────────
              GROUND LINE - Horizontal base where both poles are anchored
          ───────────────────────────────────────────────────────────────── */}
          <line
            x1="50"
            y1={baseY}
            x2="350"
            y2={baseY}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />

          {/* ─────────────────────────────────────────────────────────────────
              LEFT POLE - Leans to the left (negative angle)
              Highlights pink when chosen and animation is complete
          ───────────────────────────────────────────────────────────────── */}
          <motion.line
            x1={centerX - POLE_GAP / 2}
            y1={baseY}
            x2={centerX - POLE_GAP / 2 + leftPoleEnd.x}
            y2={baseY + leftPoleEnd.y}
            stroke={chosenPole === 'left' && animationPhase === 'done' ? '#FF2BA1' : 'rgba(255,255,255,0.7)'}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6 }}
          />

          {/* ─────────────────────────────────────────────────────────────────
              RIGHT POLE - Leans to the right (positive angle)
              Highlights pink when chosen and animation is complete
          ───────────────────────────────────────────────────────────────── */}
          <motion.line
            x1={centerX + POLE_GAP / 2}
            y1={baseY}
            x2={centerX + POLE_GAP / 2 + rightPoleEnd.x}
            y2={baseY + rightPoleEnd.y}
            stroke={chosenPole === 'right' && animationPhase === 'done' ? '#FF2BA1' : 'rgba(255,255,255,0.7)'}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6 }}
          />

          {/* ─────────────────────────────────────────────────────────────────
              ANGLE LABELS - Display the angle of each pole
              Always shows positive values (absolute value)
              Positioned at the midpoint of each pole
          ───────────────────────────────────────────────────────────────── */}
          <text
            x={centerX - POLE_GAP / 2 + leftPoleEnd.x / 2 - 25}
            y={baseY + leftPoleEnd.y / 2}
            fill={chosenPole === 'left' && animationPhase === 'done' ? '#FF2BA1' : 'rgba(255,255,255,0.6)'}
            fontSize="13"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {Math.abs(leftAngle)}°
          </text>
          <text
            x={centerX + POLE_GAP / 2 + rightPoleEnd.x / 2 + 10}
            y={baseY + rightPoleEnd.y / 2}
            fill={chosenPole === 'right' && animationPhase === 'done' ? '#FF2BA1' : 'rgba(255,255,255,0.6)'}
            fontSize="13"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {Math.abs(rightAngle)}°
          </text>

          {/* ─────────────────────────────────────────────────────────────────
              BASE SLIME BLOB - The main body of the slime mold at ground level
              - Yellow/gold color (#FFC738) representing the organism
              - Shrinks and fades when animation completes (mass moved to chosen pole)
          ───────────────────────────────────────────────────────────────── */}
          <motion.ellipse
            cx={centerX}
            cy={baseY + 5}
            rx={POLE_GAP / 2 + 10}
            ry={15}
            fill="#FFC738"
            opacity={0.6}
            initial={{ scale: 0 }}
            animate={{ 
              scale: animationPhase === 'done' ? 0.3 : 1,
              opacity: animationPhase === 'done' ? 0.2 : 0.6 
            }}
            transition={{ duration: 0.5 }}
          />

          {/* ─────────────────────────────────────────────────────────────────
              LEFT SLIME TENDRIL - The exploring "arm" climbing the left pole
              - Size grows as it climbs higher (more mass committed to this path)
              - Disappears when retracted (slimePositions.left = 0)
          ───────────────────────────────────────────────────────────────── */}
          {slimePositions.left > 0 && (
            <motion.circle
              cx={centerX - POLE_GAP / 2 + leftSlimePos.x}
              cy={baseY + leftSlimePos.y}
              r={SLIME_RADIUS * (slimePositions.left / 100 + 0.5)}
              fill="#FFC738"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: slimePositions.left > 0 ? 0.9 : 0,
                r: SLIME_RADIUS * (slimePositions.left / 100 + 0.5)
              }}
            />
          )}

          {/* ─────────────────────────────────────────────────────────────────
              RIGHT SLIME TENDRIL - The exploring "arm" climbing the right pole
              - Same behavior as left tendril but on the right pole
          ───────────────────────────────────────────────────────────────── */}
          {slimePositions.right > 0 && (
            <motion.circle
              cx={centerX + POLE_GAP / 2 + rightSlimePos.x}
              cy={baseY + rightSlimePos.y}
              r={SLIME_RADIUS * (slimePositions.right / 100 + 0.5)}
              fill="#FFC738"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: slimePositions.right > 0 ? 0.9 : 0,
                r: SLIME_RADIUS * (slimePositions.right / 100 + 0.5)
              }}
            />
          )}

          {/* ─────────────────────────────────────────────────────────────────
              CONNECTION LINES - Visual connection between base blob and tendrils
              - Shows the "veins" of the slime mold network
              - Only visible while climbing (disappears when tendril reaches 100%)
          ───────────────────────────────────────────────────────────────── */}
          {slimePositions.left > 0 && slimePositions.left < 100 && (
            <line
              x1={centerX - POLE_GAP / 4}
              y1={baseY}
              x2={centerX - POLE_GAP / 2 + leftSlimePos.x}
              y2={baseY + leftSlimePos.y}
              stroke="#FFC738"
              strokeWidth="3"
              opacity={0.5}
            />
          )}
          {slimePositions.right > 0 && slimePositions.right < 100 && (
            <line
              x1={centerX + POLE_GAP / 4}
              y1={baseY}
              x2={centerX + POLE_GAP / 2 + rightSlimePos.x}
              y2={baseY + rightSlimePos.y}
              stroke="#FFC738"
              strokeWidth="3"
              opacity={0.5}
            />
          )}
        </svg>

        {/* Status text */}
        <motion.p
          className="text-center text-sm sm:text-base text-white/60 mt-3"
          animate={{ opacity: 1 }}
        >
          {animationPhase === 'idle' && '🧫 Preparing slime mold...'}
          {animationPhase === 'climbing' && '🔍 Exploring both paths...'}
          {animationPhase === 'choosing' && `⚡ Moving to the easier climb...`}
          {animationPhase === 'done' && (
            <span className="text-biogold font-semibold">
              ✓ Chose {chosenPole} pole ({Math.abs(chosenPole === 'left' ? leftAngle : rightAngle)}° — easier climb!)
            </span>
          )}
        </motion.p>

        {/* Restart button */}
        {animationPhase === 'done' && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleRestart}
            className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/70 hover:text-white text-sm transition-all mx-auto block"
          >
            🔄 Run Again
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

export default function ResultScreen({
  trainingStarted,
  trainingScore,
  answers,
  mapView,
  pinCoordinates,
  onRestart,
}: ResultScreenProps) {
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [heatmapData, setHeatmapData] = useState<number[][]>([])
  const [cellSize, setCellSize] = useState(24)
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null)
  const mapWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showHeatmap || !mapWrapperRef.current) return

    const generateHeatmap = async () => {
      const L = (await import('leaflet')).default

      const width = mapWrapperRef.current!.clientWidth
      const height = mapWrapperRef.current!.clientHeight
      if (!width || !height) return

      const size = Math.max(18, Math.min(36, Math.floor(width / 22)))
      setCellSize(size)

      const cols = Math.ceil(width / size)
      const rows = Math.ceil(height / size)

      let pinPixel: { x: number; y: number } | null = null
      if (pinCoordinates && mapInstance) {
        const point = mapInstance.latLngToContainerPoint(L.latLng(pinCoordinates.lat, pinCoordinates.lng))
        pinPixel = { x: point.x, y: point.y }
      }

      // Create 1-2 large concentrated clusters
      const numClusters = 1 + Math.floor(Math.random() * 2)
      const clusters: { x: number; y: number; intensity: number; radius: number }[] = []

      if (pinPixel) {
        clusters.push({
          x: pinPixel.x,
          y: pinPixel.y,
          intensity: 0.9,
          radius: 140 + Math.random() * 80,
        })
      }

      for (let i = clusters.length; i < numClusters; i++) {
        clusters.push({
          x: Math.random() * width,
          y: Math.random() * height,
          intensity: 0.75 + Math.random() * 0.2,
          radius: 120 + Math.random() * 80,
        })
      }

      const grid: number[][] = []
      for (let row = 0; row < rows; row++) {
        const rowData: number[] = []
        for (let col = 0; col < cols; col++) {
          const cellX = col * size + size / 2
          const cellY = row * size + size / 2

          let maxInfluence = 0
          for (const cluster of clusters) {
            const distX = cellX - cluster.x
            const distY = cellY - cluster.y
            const distance = Math.sqrt(distX * distX + distY * distY)
            const sigma = cluster.radius / 2
            const influence = cluster.intensity * Math.exp(-(distance * distance) / (2 * sigma * sigma))
            maxInfluence = Math.max(maxInfluence, influence)
          }

          const baseNoise = 0.15 + Math.random() * 0.15
          const value = Math.min(1, maxInfluence * 0.85 + baseNoise * 0.15)
          rowData.push(value)
        }
        grid.push(rowData)
      }

      setHeatmapData(grid)
    }

    generateHeatmap()
  }, [showHeatmap, mapInstance, pinCoordinates])

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
              {trainingScore}% you would find an archaeological settlement if you are in the darker area
            </motion.p>

            {/* Show heatmap button */}
            {!showHeatmap && (
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
              {showHeatmap && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="w-full max-w-4xl mx-auto mt-8"
                >
                  <div className="relative border-2 border-white/20 rounded-lg p-2 sm:p-4 bg-black/10 overflow-hidden">
                    <div
                      ref={mapWrapperRef}
                      className="relative h-[55vh] sm:h-[60vh] w-full rounded-lg overflow-hidden"
                    >
                      <MapContainer
                        center={mapView?.center ?? DEFAULT_CENTER}
                        zoom={mapView?.zoom ?? DEFAULT_ZOOM}
                        scrollWheelZoom
                        className="h-full w-full"
                        whenCreated={setMapInstance}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {pinCoordinates && (
                          <CircleMarker
                            center={pinCoordinates}
                            radius={8}
                            pathOptions={{ color: '#FF2BA1', fillColor: '#FF2BA1', fillOpacity: 0.9 }}
                          />
                        )}
                      </MapContainer>
                    </div>

                    {/* Heatmap grid overlay - z-10 to be on top of the map */}
                    {heatmapData.length > 0 && (
                      <div className="absolute inset-0 pointer-events-none z-10">
                        {heatmapData.map((row, rowIdx) =>
                          row.map((value, colIdx) => {
                            let redValue: number
                            let opacity: number

                            if (value < 0.3) {
                              redValue = 180
                              opacity = 0.4 + value * 0.2
                            } else if (value < 0.5) {
                              redValue = 150
                              opacity = 0.5 + (value - 0.3) * 0.2
                            } else if (value < 0.7) {
                              redValue = 120
                              opacity = 0.6 + (value - 0.5) * 0.15
                            } else if (value < 0.85) {
                              redValue = 90
                              opacity = 0.65 + (value - 0.7) * 0.2
                            } else {
                              redValue = 60
                              opacity = 0.7 + (value - 0.85) * 0.2
                            }

                            return (
                              <motion.div
                                key={`${rowIdx}-${colIdx}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity }}
                                transition={{ duration: 0.3, delay: (rowIdx + colIdx) * 0.005 }}
                                className="absolute"
                                style={{
                                  left: `${colIdx * cellSize}px`,
                                  top: `${rowIdx * cellSize}px`,
                                  width: `${cellSize}px`,
                                  height: `${cellSize}px`,
                                  backgroundColor: `rgb(${redValue}, 0, 0)`,
                                  opacity,
                                  border: '0.5px solid rgba(255, 0, 0, 0.1)',
                                }}
                              />
                            )
                          })
                        )}
                      </div>
                    )}

                    {/* Legend */}
                    <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 shadow-lg z-20">
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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Slime Mold Simulation */}
            {showHeatmap && <SlimeMoldSimulation />}

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

