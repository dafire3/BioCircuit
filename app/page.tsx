'use client'

import { useState } from 'react'
import IntroLogo from '@/components/IntroLogo'
import UploadStep from '@/components/UploadStep'
import QuestionWizard from '@/components/QuestionWizard'
import ResultScreen from '@/components/ResultScreen'
import MiniHeader from '@/components/MiniHeader'

type Step = 'intro' | 'upload' | 'questions' | 'result'

export default function Home() {
  const [step, setStep] = useState<Step>('intro')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [trainingStarted, setTrainingStarted] = useState(false)
  const [trainingScore, setTrainingScore] = useState<number | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [pinCoordinates, setPinCoordinates] = useState<{ x: number; y: number } | null>(null)

  const handleIntroComplete = () => {
    setStep('upload')
  }

  const handleUploadComplete = (imageUrl: string, pinCoords?: { x: number; y: number }) => {
    setUploadedImageUrl(imageUrl)
    if (pinCoords) {
      setPinCoordinates(pinCoords)
      setAnswers((prev) => ({
        ...prev,
        pinCoordinates: `${pinCoords.x},${pinCoords.y}`,
      }))
    }
    setStep('questions')
  }

  const handleQuestionsComplete = (
    questionAnswers: Record<string, string>,
    started: boolean,
    score: number | null
  ) => {
    setAnswers(questionAnswers)
    setTrainingStarted(started)
    setTrainingScore(score)
    setStep('result')
  }

  const handleRestart = () => {
    setStep('upload')
    setAnswers({})
    setTrainingStarted(false)
    setTrainingScore(null)
    setUploadedImageUrl(null)
    setPinCoordinates(null)
  }

  return (
    <main className="min-h-screen">
      {step !== 'intro' && <MiniHeader />}
      
      {step === 'intro' && <IntroLogo onComplete={handleIntroComplete} />}
      {step === 'upload' && <UploadStep onUploadComplete={handleUploadComplete} />}
      {step === 'questions' && (
        <QuestionWizard
          onComplete={handleQuestionsComplete}
        />
      )}
      {step === 'result' && (
        <ResultScreen
          trainingStarted={trainingStarted}
          trainingScore={trainingScore}
          answers={answers}
          uploadedImageUrl={uploadedImageUrl}
          pinCoordinates={pinCoordinates}
          onRestart={handleRestart}
        />
      )}
    </main>
  )
}

