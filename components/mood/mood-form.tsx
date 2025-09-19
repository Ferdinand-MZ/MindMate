"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Slider } from "@/components/ui/slider"
import { Loader2 } from "lucide-react"

import { useRouter } from "next/navigation"

interface MoodFormProps {
    onSuccess?: () => void
}

export function MoodForm({onSuccess}:MoodFormProps) {
    const [moodScore, setMoodScore] = useState(50)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const emotions = [
    { value: 0, label: "😔", description: "Sangat Rendah" },
    { value: 25, label: "😕", description: "Rendah" },
    { value: 50, label: "😊", description: "Netral" },
    { value: 75, label: "😃", description: "Baik" },
    { value: 100, label: "🤗", description: "Bagus" },
  ];

    const currentEmotion = emotions.find((em) => Math.abs(moodScore - em.value) < 15) || emotions[2];
    
    return (
        <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
                <div className="text-4xl">{currentEmotion.label}</div>
                <div className="text-sm text-muted-foreground">{currentEmotion.description}</div>
            </div>
        
            <div className="space-y-4">
                <div className="flex-justify-between px-2">
                    {emotions.map((em) => (
                        <div
                        key={em.value}
                        className={`cursor-pointer transition-opacity ${Math.abs(moodScore - em.value) < 15 ? "opacity-100" : "opacity-50"}`}
                        onClick={() => setMoodScore(em.value)}
                        >
                            <div className="text-2xl">{em.label}</div>
                        </div>
                    ))}
                </div>

                <Slider
                    value={[moodScore]}
                    onValueChange={(value) => setMoodScore (value[0])}
                    min={0}
                    max={100}
                    step={1}
                    className="py-4"
                />
            </div>
            <Button className="w-full">Simpan Mood</Button>
            
        </div>
    )
}