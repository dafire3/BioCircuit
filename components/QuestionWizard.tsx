'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'

interface QuestionWizardProps {
  onComplete: (answers: Record<string, string>, trainingStarted: boolean, trainingScore: number | null) => void
}

const QUESTIONS = [
  {
    id: 'river-distance',
    text: 'How far away is the nearest river?',
    type: 'text' as const,
  },
  {
    id: 'settlement-age',
    text: 'How old is the archaeological settlement?',
    type: 'text' as const,
  },
  {
    id: 'sediment-topology',
    text: 'How is the sediment or topology of the area?',
    type: 'text' as const,
  },
  {
    id: 'vegetation-edible',
    text: 'Would the vegetation in that area have been edible at the time this settlement existed?',
    type: 'text' as const,
  },
  {
    id: 'start-training',
    text: 'Would you like to start AI training?',
    type: 'yesno' as const,
  },
]

export default function QuestionWizard({ onComplete }: QuestionWizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedYesNo, setSelectedYesNo] = useState<'yes' | 'no' | null>(null)
  const [isShaking, setIsShaking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentQuestion = QUESTIONS[currentIndex]
  const currentAnswer = answers[currentQuestion.id] || ''
  const isLastQuestion = currentIndex === QUESTIONS.length - 1

  // Focus input on question change
  useEffect(() => {
    if (currentQuestion.type === 'text') {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        } else if (textareaRef.current) {
          textareaRef.current.focus()
        }
      }, 300)
    }
  }, [currentIndex, currentQuestion.type])

  // Handle keyboard navigation for yes/no question
  useEffect(() => {
    if (isLastQuestion && currentQuestion.type === 'yesno') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
          setSelectedYesNo('yes')
        } else if (e.key === 'ArrowRight') {
          setSelectedYesNo('no')
        } else if (e.key === 'Enter' && selectedYesNo) {
          handleYesNoSubmit(selectedYesNo)
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLastQuestion, selectedYesNo])

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault()
      handleNext()
    }
  }

  const handleNext = () => {
    if (isLastQuestion) {
      if (currentQuestion.type === 'yesno' && selectedYesNo) {
        handleYesNoSubmit(selectedYesNo)
      } else if (currentQuestion.type === 'yesno' && !selectedYesNo) {
        triggerShake()
      }
      return
    }

    if (!currentAnswer.trim()) {
      triggerShake()
      return
    }

    setCurrentIndex((prev) => prev + 1)
  }

  const triggerShake = () => {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 500)
  }

  const handleYesNoSubmit = (choice: 'yes' | 'no') => {
    const trainingStarted = choice === 'yes'
    const trainingScore = trainingStarted ? Math.floor(Math.random() * 101) : null

    const finalAnswers = {
      ...answers,
      [currentQuestion.id]: choice,
    }

    setAnswers(finalAnswers)

    setTimeout(() => {
      onComplete(finalAnswers, trainingStarted, trainingScore)
    }, 300)
  }

  // Calculate completion ratio for color transition (0-60 chars)
  const completionRatio = Math.min(currentAnswer.length / 60, 1)
  const lineColor = `hsl(${120 + (1 - completionRatio) * 60}, ${30 + completionRatio * 40}%, ${40 + completionRatio * 30}%)`

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-20">
      <div className="max-w-3xl w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ y: 200, opacity: 0, filter: 'blur(10px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: -200, opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="space-y-8 sm:space-y-12"
          >
            {/* Question text */}
            <motion.h2
              animate={isShaking ? { x: [0, -10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-center text-white leading-tight px-2"
            >
              {currentQuestion.text}
            </motion.h2>

            {/* Input area */}
            {currentQuestion.type === 'text' ? (
              <div className="relative w-full" style={{ minHeight: '40px' }}>
                {/* Underline */}
                <div
                  className="absolute top-1/2 left-0 h-px w-full transition-colors duration-300"
                  style={{ backgroundColor: lineColor, transform: 'translateY(-50%)' }}
                />
                {/* Input field - positioned on the line */}
                <input
                  ref={inputRef}
                  type="text"
                  value={currentAnswer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="absolute top-1/2 left-0 w-full bg-transparent border-none outline-none text-white text-lg sm:text-xl md:text-2xl text-center focus:outline-none focus:ring-0 placeholder-white/30"
                  style={{
                    transform: 'translateY(-50%)',
                    padding: 0,
                    lineHeight: 'normal',
                  }}
                  placeholder=""
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mt-6 sm:mt-8 px-4">
                <motion.button
                  onClick={() => {
                    setSelectedYesNo('yes')
                    setTimeout(() => handleYesNoSubmit('yes'), 100)
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${
                    selectedYesNo === 'yes'
                      ? 'bg-accent text-white focus:ring-accent'
                      : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20 focus:ring-white/50'
                  }`}
                >
                  Yes, start training
                </motion.button>
                <motion.button
                  onClick={() => {
                    setSelectedYesNo('no')
                    setTimeout(() => handleYesNoSubmit('no'), 100)
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${
                    selectedYesNo === 'no'
                      ? 'bg-white/20 text-white border-2 border-white/40 focus:ring-white/50'
                      : 'bg-transparent text-white/70 border border-white/20 hover:bg-white/10 focus:ring-white/30'
                  }`}
                >
                  No, not now
                </motion.button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

