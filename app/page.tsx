'use client'

import { useState } from 'react'
import type { LatLngLiteral } from 'leaflet'
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
  const [mapView, setMapView] = useState<{ center: LatLngLiteral; zoom: number } | null>(null)
  const [pinCoordinates, setPinCoordinates] = useState<LatLngLiteral | null>(null)

  const handleIntroComplete = () => {
    setStep('upload')
  }

  const handleUploadComplete = (mapState: { center: LatLngLiteral; zoom: number; pin: LatLngLiteral }) => {
    setMapView({ center: mapState.center, zoom: mapState.zoom })
    setPinCoordinates(mapState.pin)
    setAnswers((prev) => ({
      ...prev,
      pinCoordinates: `${mapState.pin.lat.toFixed(5)},${mapState.pin.lng.toFixed(5)}`,
    }))
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
    setMapView(null)
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
          mapView={mapView}
          pinCoordinates={pinCoordinates}
          onRestart={handleRestart}
        />
      )}
    </main>
  )
}

