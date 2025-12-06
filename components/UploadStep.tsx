'use client'

import { useState, useRef, DragEvent, MouseEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface UploadStepProps {
  onUploadComplete: (imageUrl: string, pinCoordinates?: { x: number; y: number }) => void
}

export default function UploadStep({ onUploadComplete }: UploadStepProps) {
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [pinPosition, setPinPosition] = useState<{ x: number; y: number } | null>(null)
  const [showPinQuestion, setShowPinQuestion] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (validTypes.includes(selectedFile.type)) {
      setFile(selectedFile)
      setError(null)
      
      // Create object URL for image preview
      const url = URL.createObjectURL(selectedFile)
      setImageUrl(url)
      
      // Show pin question after a short delay
      setTimeout(() => {
        setShowPinQuestion(true)
      }, 500)
    } else {
      setError('Please upload a PNG or JPG image file')
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || !imageUrl) return

    const containerRect = imageContainerRef.current.getBoundingClientRect()
    const img = imageContainerRef.current.querySelector('img')
    if (!img) return

    const imgRect = img.getBoundingClientRect()
    
    // Calculate click position relative to the image (not container)
    const x = e.clientX - imgRect.left
    const y = e.clientY - imgRect.top

    // Constrain to image bounds
    const constrainedX = Math.max(0, Math.min(x, imgRect.width))
    const constrainedY = Math.max(0, Math.min(y, imgRect.height))

    // Store position relative to container for absolute positioning
    const containerX = e.clientX - containerRect.left
    const containerY = e.clientY - containerRect.top

    setPinPosition({ x: containerX, y: containerY })
  }

  const handleContinue = () => {
    if (!file || !imageUrl) return

    // Don't revoke URL yet - we need it for the result screen
    // It will be cleaned up when component unmounts or on restart
    onUploadComplete(imageUrl, pinPosition || undefined)
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

      <div className="max-w-2xl w-full space-y-8">
        {/* Header - only show when no image */}
        {!imageUrl && (
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
              Upload a map or LiDAR scan to begin.
            </p>
          </div>
        )}

        {/* Dropzone or Image Display */}
        {!imageUrl ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="relative border-2 border-dashed border-white/20 rounded-lg p-8 sm:p-12 md:p-16 text-center cursor-pointer transition-all hover:border-white/40 hover:bg-white/5"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="space-y-3 sm:space-y-4">
              <div className="text-4xl sm:text-5xl md:text-6xl mb-2 sm:mb-4">📄</div>
              <p className="text-base sm:text-lg text-white/80 px-2">
                Drop your map here, or click to upload
              </p>
              <p className="text-xs sm:text-sm text-white/50">
                PNG or JPG files
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-full"
          >
            {/* Image container with click handler - same styling as dropzone */}
            <div
              ref={imageContainerRef}
              onClick={handleImageClick}
              className="relative border-2 border-dashed border-white/20 rounded-lg p-2 sm:p-4 bg-black/10 cursor-crosshair transition-all hover:border-white/30 overflow-hidden"
            >
              <img
                src={imageUrl}
                alt="Uploaded map"
                className="w-full h-auto max-h-[50vh] sm:max-h-[60vh] object-contain mx-auto block rounded"
                draggable={false}
              />
              
              {/* Pin marker */}
              {pinPosition && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute pointer-events-none z-10"
                  style={{
                    left: `${pinPosition.x}px`,
                    top: `${pinPosition.y}px`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <div className="w-6 h-6 bg-accent rounded-full border-2 border-white shadow-lg" />
                  <div className="w-1 h-8 bg-accent mx-auto mt-0.5" />
                </motion.div>
              )}

              {/* Click hint overlay */}
              {!pinPosition && showPinQuestion && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 rounded backdrop-blur-sm"
                >
                  <p className="text-white/80 text-sm sm:text-base md:text-lg font-light px-4 text-center">Click on the artifact location</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Continue button */}
        <AnimatePresence>
          {imageUrl && pinPosition && (
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

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-red-400"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

