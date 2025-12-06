'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

export default function MiniHeader() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <Image
            src="/biocircuit-logo.png"
            alt="BioCircuit"
            width={32}
            height={32}
            className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
          />
          <span className="text-sm sm:text-base md:text-lg font-semibold">BioCircuit</span>
        </div>
        <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs text-white/60 whitespace-nowrap">
          <span className="hidden sm:inline">Concept demo · Not real AI</span>
          <span className="sm:hidden">Demo</span>
        </div>
      </div>
    </motion.header>
  )
}

