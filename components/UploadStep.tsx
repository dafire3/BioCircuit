'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * UploadStep Component
 * 
 * This component handles the map-based location selection step of the BioCircuit app.
 * Users can interact with an interactive map to mark the artifact/archaeological site location.
 * 
 * Key Features:
 * - Interactive OpenStreetMap integration via react-leaflet
 * - Click-to-place pin functionality for marking locations
 * - Manual coordinate entry for precise location jumping
 * - Responsive design for mobile and desktop
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useMap, useMapEvents } from 'react-leaflet'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Latitude/Longitude coordinate pair
 * Used throughout the component for map positions and pin locations
 */
interface LatLngLiteral {
  lat: number  // Latitude: -90 to 90
  lng: number  // Longitude: -180 to 180
}

/**
 * LeafletMap interface - defines the map methods we use
 * This avoids importing the full Leaflet library types during build
 */
interface LeafletMap {
  setView(center: LatLngLiteral, zoom?: number, options?: any): this  // Set map view position
  panTo(latlng: LatLngLiteral, options?: any): this                   // Smoothly pan to location
  flyTo(latlng: LatLngLiteral, zoom?: number, options?: any): this    // Animated fly to location
  getCenter(): LatLngLiteral                                           // Get current map center
  getZoom(): number                                                    // Get current zoom level
  on(event: string, handler: any): this                               // Add event listener
  off(event: string, handler: any): this                              // Remove event listener
}

// =============================================================================
// DYNAMIC IMPORTS - React-Leaflet Components
// =============================================================================

/**
 * Dynamic imports disable Server-Side Rendering (SSR) for map components
 * This is necessary because Leaflet requires the browser's window object
 * which doesn't exist during server-side rendering in Next.js
 */
const MapContainer: any = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false })
const TileLayer: any = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false })
const CircleMarker: any = dynamic(() => import('react-leaflet').then((m) => m.CircleMarker), { ssr: false })

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/**
 * Props for the UploadStep component
 * @param onUploadComplete - Callback fired when user confirms their pin location
 *                          Receives the map state (center, zoom, and pin position)
 */
interface UploadStepProps {
  onUploadComplete: (mapState: { center: LatLngLiteral; zoom: number; pin: LatLngLiteral }) => void
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Default map center: Geographic center of the contiguous United States
const DEFAULT_CENTER: LatLngLiteral = { lat: 39.8283, lng: -98.5795 }

// Default zoom level: Shows most of the US (lower = more zoomed out)
const DEFAULT_ZOOM = 4

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * MapController - Handles programmatic map navigation
 * 
 * When user enters coordinates manually and clicks "Go to", this component
 * receives the target coordinates and smoothly animates the map to that location.
 * Uses react-leaflet's useMap hook to access the map instance.
 */
function MapController({
  target,
  zoom,
}: {
  target: LatLngLiteral | null  // Target coordinates to navigate to
  zoom: number                   // Current/desired zoom level
}) {
  const map = useMap()  // Hook to access the Leaflet map instance

  useEffect(() => {
    if (!target) return  // Don't do anything if no target is set
    // Navigate to target with minimum zoom of 14 (street-level detail)
    map.setView(target, Math.max(zoom, 14), { animate: true })
  }, [map, target, zoom])

  return null  // This component doesn't render anything visible
}

/**
 * MapClickHandler - Captures click events on the map
 * 
 * Uses react-leaflet's useMapEvents hook to listen for map clicks.
 * When user clicks anywhere on the map, it calls onPick with the coordinates.
 * This is how users place their artifact location pin.
 */
function MapClickHandler({ onPick }: { onPick: (latlng: LatLngLiteral) => void }) {
  useMapEvents({
    // Listen for click events on the map
    click(e: any) {
      onPick(e.latlng)  // Pass the clicked coordinates to parent
    },
  })
  return null  // This component doesn't render anything visible
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * UploadStep - Main map selection component
 * 
 * This is the primary component that renders the interactive map interface.
 * Users can:
 * 1. Pan/zoom the map to find their location
 * 2. Enter coordinates manually for precise navigation
 * 3. Click on the map to place a pin at the artifact location
 * 4. Confirm their selection to proceed to the questionnaire
 */
export default function UploadStep({ onUploadComplete }: UploadStepProps) {
  // -------------------------------------------------------------------------
  // STATE MANAGEMENT
  // -------------------------------------------------------------------------
  
  // Pin state: stores the user's selected artifact location (null if not yet placed)
  const [pinPosition, setPinPosition] = useState<LatLngLiteral | null>(null)
  
  // UI state: controls visibility of the "Drop a pin" instruction banner
  const [showPinQuestion, setShowPinQuestion] = useState(false)
  
  // Map viewport state: tracks the current center and zoom level
  const [mapCenter, setMapCenter] = useState<LatLngLiteral>(DEFAULT_CENTER)
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM)
  
  // Map instance reference: used to programmatically control the map
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null)
  
  // Coordinate input state: for manual coordinate entry feature
  const [coordLat, setCoordLat] = useState('')   // Latitude text input value
  const [coordLng, setCoordLng] = useState('')   // Longitude text input value
  const [coordError, setCoordError] = useState<string | null>(null)  // Validation error message
  const [targetCoords, setTargetCoords] = useState<LatLngLiteral | null>(null)  // Coordinates to navigate to

  // -------------------------------------------------------------------------
  // MAP EVENT HANDLERS
  // -------------------------------------------------------------------------

  /**
   * Effect: Set up map event listeners when map instance is available
   * 
   * This effect runs when the Leaflet map is created and:
   * 1. Listens for click events to place pins
   * 2. Tracks map movement to keep our state in sync with the map viewport
   * 3. Shows the instruction banner once the map is ready
   */
  useEffect(() => {
    if (!mapInstance) return  // Wait for map to be created

    // Handler for map click events - places the artifact pin
    const handleMapClick = (e: { latlng: LatLngLiteral }) => {
      setPinPosition(e.latlng)  // Store the clicked location
    }

    // Handler for map movement - keeps our state synced with map viewport
    const handleMoveEnd = () => {
      const center = mapInstance.getCenter()
      setMapCenter({ lat: center.lat, lng: center.lng })  // Update center state
      setMapZoom(mapInstance.getZoom())                   // Update zoom state
    }

    // Attach event listeners to the map
    mapInstance.on('click', handleMapClick)
    mapInstance.on('moveend', handleMoveEnd)
    
    // Show the instruction banner now that map is ready
    setShowPinQuestion(true)

    // Cleanup: remove event listeners when component unmounts or map changes
    return () => {
      mapInstance.off('click', handleMapClick)
      mapInstance.off('moveend', handleMoveEnd)
    }
  }, [mapInstance])

  // -------------------------------------------------------------------------
  // USER ACTION HANDLERS
  // -------------------------------------------------------------------------

  /**
   * handleContinue - Called when user clicks "Continue to Questions" button
   * Passes the current map state and pin location to the parent component
   */
  const handleContinue = () => {
    if (!pinPosition) return  // Safety check: can't continue without a pin
    onUploadComplete({ center: mapCenter, zoom: mapZoom, pin: pinPosition })
  }

  /**
   * handleGoToCoordinates - Validates and navigates to manually entered coordinates
   * 
   * Validation checks:
   * 1. Both values must be valid numbers
   * 2. Latitude must be between -90 and 90
   * 3. Longitude must be between -180 and 180
   */
  const handleGoToCoordinates = () => {
    // Parse input strings to numbers
    const lat = Number(coordLat)
    const lng = Number(coordLng)
    
    // Validate: check if inputs are valid numbers
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setCoordError('Enter valid numbers for latitude and longitude.')
      return
    }
    
    // Validate: check if coordinates are within valid ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setCoordError('Latitude must be -90 to 90, longitude -180 to 180.')
      return
    }
    
    // Validation passed - clear any previous error and navigate
    setCoordError(null)
    setTargetCoords({ lat, lng })  // This triggers MapController to move the map
  }

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  return (
    <motion.div
      // Fade-in and slide-up animation when component mounts
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20"
    >
      {/* ===================================================================
          INSTRUCTION BANNER
          Animated banner that slides down from top, instructing user to drop a pin.
          Uses AnimatePresence for smooth enter/exit animations.
          Disappears when user places a pin (showPinQuestion becomes false).
          =================================================================== */}
      <AnimatePresence>
        {showPinQuestion && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}      // Start above viewport, invisible
            animate={{ y: 0, opacity: 1 }}         // Slide down to position
            exit={{ y: -100, opacity: 0 }}         // Slide back up when hidden
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}  // Custom easing
            className="fixed top-16 sm:top-20 left-0 right-0 z-40 flex justify-center pointer-events-none px-4"
          >
            <div className="bg-background/98 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl px-6 sm:px-10 py-3 sm:py-5 shadow-2xl max-w-[90vw]">
              <p className="text-lg sm:text-xl md:text-2xl font-light text-white text-center tracking-wide">
                Drop a pin on the artifact location
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl w-full space-y-8">
        {/* ===================================================================
            HEADER SECTION
            Displays the BioCircuit logo and brief instruction text
            =================================================================== */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Image
              src="/biocircuit-logo.png"
              alt="BioCircuit"
              width={48}
              height={48}
              className="w-8 h-8 sm:w-12 sm:h-12"
            />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">BioCircuit</h1>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-white/70 px-2">
            Click on the map to mark the artifact location.
          </p>
        </div>

        {/* ===================================================================
            COORDINATE INPUT SECTION
            Allows users to manually enter latitude/longitude coordinates
            and jump directly to that location on the map.
            Useful for users who know the exact coordinates of their site.
            =================================================================== */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch">
          {/* Latitude input field */}
          <input
            value={coordLat}
            onChange={(e) => setCoordLat(e.target.value)}
            placeholder="Latitude (e.g., 34.0522)"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm sm:text-base text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {/* Longitude input field */}
          <input
            value={coordLng}
            onChange={(e) => setCoordLng(e.target.value)}
            placeholder="Longitude (e.g., -118.2437)"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm sm:text-base text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {/* "Go to" button - triggers coordinate validation and map navigation */}
          <button
            onClick={handleGoToCoordinates}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/80 hover:text-white text-sm sm:text-base transition-all"
          >
            Go to
          </button>
        </div>
        {/* Display validation error message if coordinates are invalid */}
        {coordError && (
          <p className="text-sm text-red-400 text-center">{coordError}</p>
        )}

        {/* ===================================================================
            INTERACTIVE MAP SECTION
            The main map component where users can:
            - Pan and zoom to explore different areas
            - Click to place a pin marking their artifact location
            
            Uses react-leaflet with OpenStreetMap tiles for the base map.
            =================================================================== */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-full"
        >
          <div className="relative border-2 border-dashed border-white/20 rounded-lg p-2 sm:p-4 bg-black/10 overflow-hidden">
            <div className="h-[55vh] sm:h-[60vh] w-full rounded-lg overflow-hidden">
              {/* MapContainer: The main Leaflet map wrapper */}
              <MapContainer
                center={mapCenter}           // Initial center position
                zoom={mapZoom}               // Initial zoom level
                scrollWheelZoom              // Enable zoom with scroll wheel
                className="h-full w-full"
                whenCreated={setMapInstance} // Store map instance for programmatic control
              >
                {/* TileLayer: Loads map tiles from OpenStreetMap */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* MapController: Handles navigation to manually entered coordinates */}
                <MapController target={targetCoords} zoom={mapZoom} />
                
                {/* MapClickHandler: Captures clicks and places the pin */}
                <MapClickHandler
                  onPick={(latlng) => {
                    setPinPosition(latlng)        // Store the pin location
                    setShowPinQuestion(false)     // Hide the instruction banner
                  }}
                />
                
                {/* CircleMarker: The visual pin showing the selected location */}
                {pinPosition && (
                  <CircleMarker
                    center={pinPosition}
                    radius={8}
                    pathOptions={{ color: '#FF2BA1', fillColor: '#FF2BA1', fillOpacity: 0.9 }}
                  />
                )}
              </MapContainer>
            </div>

            {/* ---------------------------------------------------------------
                CLICK HINT OVERLAY
                Semi-transparent overlay shown before user places a pin.
                Provides a visual cue that they need to click on the map.
                Disappears once a pin is placed.
                --------------------------------------------------------------- */}
            {!pinPosition && showPinQuestion && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm"
              >
                <p className="text-white/80 text-sm sm:text-base md:text-lg font-light px-4 text-center">
                  Click on the artifact location
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ===================================================================
            CONTINUE BUTTON
            Only appears after user has placed a pin on the map.
            Uses AnimatePresence for smooth fade-in animation.
            Clicking proceeds to the questionnaire step.
            =================================================================== */}
        <AnimatePresence>
          {pinPosition && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}   // Start invisible, slightly below
              animate={{ opacity: 1, y: 0 }}    // Fade in and move to position
              exit={{ opacity: 0 }}             // Fade out when hidden
              onClick={handleContinue}
              className="w-full py-3 sm:py-4 px-6 sm:px-8 bg-accent text-white text-sm sm:text-base font-semibold rounded-lg transition-all hover:scale-105 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            >
              Continue to Questions
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

