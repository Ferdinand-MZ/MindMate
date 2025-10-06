"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Slider } from "@/components/ui/slider"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/contexts/session-context"

interface MoodFormProps {
  onSuccess?: () => void
}

export function MoodForm({ onSuccess }: MoodFormProps) {
  const [moodScore, setMoodScore] = useState(50)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { isAuthenticated, loading } = useSession()

  const emotions = [
    { value: 0, label: "😔", description: "Sangat Rendah" },
    { value: 25, label: "😕", description: "Rendah" },
    { value: 50, label: "😊", description: "Netral" },
    { value: 75, label: "😃", description: "Baik" },
    { value: 100, label: "🤗", description: "Bagus" },
  ]

  const currentEmotion =
    emotions.find((em) => Math.abs(moodScore - em.value) < 15) || emotions[2]

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      alert("Perlu masuk!")
      router.push("/login")
      return
    }

    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")

      const response = await fetch("/api/mood", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ score: moodScore }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("MoodForm: Error response:", error)
        throw new Error(error.error || "Gagal meng-track mood")
      }

      await response.json()
      alert("Mood berhasil di-track!")
      onSuccess?.()
    } catch (err: any) {
      alert(err.message || "Gagal untuk track mood")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <div className="text-4xl">{currentEmotion.label}</div>
        <div className="text-sm text-muted-foreground">
          {currentEmotion.description}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between px-2">
          {emotions.map((em) => (
            <div
              key={em.value}
              className={`cursor-pointer transition-opacity ${
                Math.abs(moodScore - em.value) < 15
                  ? "opacity-100"
                  : "opacity-50"
              }`}
              onClick={() => setMoodScore(em.value)}
            >
              <div className="text-2xl">{em.label}</div>
            </div>
          ))}
        </div>

        <Slider
          value={[moodScore]}
          onValueChange={(value) => setMoodScore(value[0])}
          min={0}
          max={100}
          step={1}
          className="py-4"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading || loading}
        className="w-full"
      >
        {isLoading ? "Menyimpan..." : "Simpan Mood"}
      </Button>
    </div>
  )
}
