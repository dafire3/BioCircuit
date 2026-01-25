'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import type { LatLngLiteral, Map as LeafletMap } from 'leaflet'
import { useMap, useMapEvents } from 'react-leaflet'

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false })
const CircleMarker = dynamic(() => import('react-leaflet').then((m) => m.CircleMarker), { ssr: false })

interface UploadStepProps {
  onUploadComplete: (mapState: { center: LatLngLiteral; zoom: number; pin: LatLngLiteral }) => void
}

const DEFAULT_CENTER: LatLngLiteral = { lat: 39.8283, lng: -98.5795 }
const DEFAULT_ZOOM = 4

function MapController({
  target,
  zoom,
}: {
  target: LatLngLiteral | null
  zoom: number
}) {
  const map = useMap()

  useEffect(() => {
    if (!target) return
    map.setView(target, Math.max(zoom, 14), { animate: true })
  }, [map, target, zoom])

  return null
}

function MapClickHandler({ onPick }: { onPick: (latlng: LatLngLiteral) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng)
    },
  })
  return null
}

export default function UploadStep({ onUploadComplete }: UploadStepProps) {
  const [pinPosition, setPinPosition] = useState<LatLngLiteral | null>(null)
  const [showPinQuestion, setShowPinQuestion] = useState(false)
  const [mapCenter, setMapCenter] = useState<LatLngLiteral>(DEFAULT_CENTER)
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM)
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null)
  const [coordLat, setCoordLat] = useState('')
  const [coordLng, setCoordLng] = useState('')
  const [coordError, setCoordError] = useState<string | null>(null)
  const [targetCoords, setTargetCoords] = useState<LatLngLiteral | null>(null)

  useEffect(() => {
    if (!mapInstance) return

    const handleMapClick = (e: { latlng: LatLngLiteral }) => {
      setPinPosition(e.latlng)
    }

    const handleMoveEnd = () => {
      const center = mapInstance.getCenter()
      setMapCenter({ lat: center.lat, lng: center.lng })
      setMapZoom(mapInstance.getZoom())
    }

    mapInstance.on('click', handleMapClick)
    mapInstance.on('moveend', handleMoveEnd)
    setShowPinQuestion(true)

    return () => {
      mapInstance.off('click', handleMapClick)
      mapInstance.off('moveend', handleMoveEnd)
    }
  }, [mapInstance])

  const handleContinue = () => {
    if (!pinPosition) return
    onUploadComplete({ center: mapCenter, zoom: mapZoom, pin: pinPosition })
  }

  const handleGoToCoordinates = () => {
    const lat = Number(coordLat)
    const lng = Number(coordLng)
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setCoordError('Enter valid numbers for latitude and longitude.')
      return
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setCoordError('Latitude must be -90 to 90, longitude -180 to 180.')
      return
    }
    setCoordError(null)
    setTargetCoords({ lat, lng })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20"
    >
      {/* Pin question - slides down from top */}
      <AnimatePresence>
        {showPinQuestion && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
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
        {/* Header */}
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

        {/* Coordinate jump */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch">
          <input
            value={coordLat}
            onChange={(e) => setCoordLat(e.target.value)}
            placeholder="Latitude (e.g., 34.0522)"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm sm:text-base text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            value={coordLng}
            onChange={(e) => setCoordLng(e.target.value)}
            placeholder="Longitude (e.g., -118.2437)"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm sm:text-base text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={handleGoToCoordinates}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/80 hover:text-white text-sm sm:text-base transition-all"
          >
            Go to
          </button>
        </div>
        {coordError && (
          <p className="text-sm text-red-400 text-center">{coordError}</p>
        )}

        {/* Map container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-full"
        >
          <div className="relative border-2 border-dashed border-white/20 rounded-lg p-2 sm:p-4 bg-black/10 overflow-hidden">
            <div className="h-[55vh] sm:h-[60vh] w-full rounded-lg overflow-hidden">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom
                className="h-full w-full"
                whenCreated={setMapInstance}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController target={targetCoords} zoom={mapZoom} />
                <MapClickHandler
                  onPick={(latlng) => {
                    setPinPosition(latlng)
                    setShowPinQuestion(false)
                  }}
                />
                {pinPosition && (
                  <CircleMarker
                    center={pinPosition}
                    radius={8}
                    pathOptions={{ color: '#FF2BA1', fillColor: '#FF2BA1', fillOpacity: 0.9 }}
                  />
                )}
              </MapContainer>
            </div>

            {/* Click hint overlay */}
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

        {/* Continue button */}
        <AnimatePresence>
          {pinPosition && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
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

