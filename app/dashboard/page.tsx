'use client'
import { useEffect, useState } from "react"
import { Container } from "@/components/ui/container"
import {motion } from 'framer-motion';
import {
  Brain,
  Calendar,
  Activity,
  Sun,
  Moon,
  Heart,
  Trophy,
  Bell,
  AlertCircle,
  PhoneCall,
  Sparkles,
  MessageSquare,
  BrainCircuit,
  ArrowRight,
  X,
  Loader2,
} from "lucide-react";
import {Dialog, DialogContent, DialogMeter, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {AnxietyGames} from "@/components/games/anxiety-games"
import { MoodForm } from "@/components/mood/mood-form";
import { ActivityLogger } from "@/components/activities/activity-logger";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter()
    const wellnessStats = [ 
    {
      title: "Skor Mood",
    //   value: dailyStats.moodScore ? `${dailyStats.moodScore}%` : "No data",
      value: "Tidak ada Data",
      icon: Brain,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      description: "Rata rata mood hari ini",
    },
    {
      title: "Rate Penyelesaian",
      value: "100%",
      icon: Trophy,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      description: "Sempurna",
    },
    {
      title: "Sesi Terapi",
    //   value: `${dailyStats.mindfulnessCount} sessions`,
      value: `0 sesi`,
      icon: Heart,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      description: "Total sesi diselesaikan",
    },
    {
      title: "Total Aktivitas",
    //   value: dailyStats.totalActivities.toString(),
      value: 80,
      icon: Activity,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "Rencana hari ini",
    },
  ];

  const handleMoodSubmit = async (data: {moodScore: number }) => {
    setIsSavingMood(true)
    try {
        setShowMoodModal(false)
    } catch (error) {
        console.error("Error saving mood:", error)
    } finally {
        setIsSavingMood(false)
    }
  }

  const handleAICheckIn = () => {
    setShowActivityLogger(true)
  }

    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime (new Date()), 1000);
        return () => clearInterval(timer) 
    }, [])

    const [showMoodModal, setShowMoodModal] = useState(false)
    const [isSavingMood, setIsSavingMood] = useState(false)
    const [showActivityLogger, setShowActivityLogger] = useState(false)
    
    const handleStartTherapy = () => {
        router.push("/therapy/new");
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <Container className="pt-20 pb-8 space-y-6">
            <div className="flex flex-col gap-2">

                <motion.div
                    initial={{opacity:0, x:-20}}
                    animate={{opacity:1, x:0}}
                    transition={{duration: 0.6}}
                    className="flex flex-col gap-2"
                    >
                 <h1 className="text-3xl font-bold">Selamat Datang Kembali !</h1>
                <p className="text-muted-foreground text-sm">
                    {currentTime.toLocaleDateString("id-ID", {
                    weekday: "long",
                    month: "long",
                    day: "numeric"
                    })}
                </p>       
                </motion.div>
            </div>

            {/* Grid Layout */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    <Card className="border-primary/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5
                        via-primary/10 to-transparent"/>

                        {/* Kartu Aksi */}
                        <CardContent className="p-6 relative">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex
                                    items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Aksi Cepat</h3>
                                        <p className="text-sm text-muted-foreground">Mulai perjalananmu</p>
                                    </div>
                                </div>

                            <div className="grid gap-3">
                                <Button
                                    variant="default"
                                    className={cn(
                                        "w-full justify-between items-center p-6 h-auto group/button",
                                        "bg-green-100 hover:bg-green-200",
                                        "transition-all duration-200 group-hover:translate-y-[-2px]"
                                    )}
                                    onClick={handleStartTherapy}
                                    >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center">
                                        <MessageSquare className="w-4 h-4 text-green-700" />
                                        </div>
                                        <div className="text-left">
                                        <div className="font-semibold text-green-800">Mulai Terapi</div>
                                        <div className="text-xs text-green-600">Mulai Sesi Baru</div>
                                        </div>
                                    </div>
                                    <div>
                                        <ArrowRight className="text-green-700" />
                                    </div>
                                    </Button>


                                {/* div */}
                                <div className="grid grid-cols-2 gap-3">
                                {/* Track Mood */}
                                    <Button
                                        variant="outline"
                                       className={cn(
                                        "flex flex-col h-[120px] px-4 py-3 group/mood hover:border-primary/50",
                                        "justify-center items-center text-center",
                                        "transition-all duration-200 group-hover:translate-y-[-2px]"
                                    )}
                                        // onClick=({} => setShowMoodModal(true))
                                    >   
                                        <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center
                                        justify-center mb-2">
                                            <Heart className="w-5 h-5 text-rose-500" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">Track Mood</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">Apa yang anda rasakan?</div>
                                        </div>
                                    </Button>

                                    {/* Check In button */}
                                    <Button
                                        variant="outline"
                                       className={cn(
                                        "flex flex-col h-[120px] px-4 py-3 group/mood hover:border-primary/50",
                                        "justify-center items-center text-center",
                                        "transition-all duration-200 group-hover:translate-y-[-2px]"
                                    )}
                                        onClick={handleAICheckIn}
                                    >   
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center
                                        justify-center mb-2">
                                            <BrainCircuit className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">Check-in</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">Check kesehatan cepat</div>
                                        </div>
                                    </Button>
                                </div>
                            </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Kartu Overview Hari Ini */}
                    <Card className="border-primary/10">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Overview Hari Ini</CardTitle>
                                    <CardDescription>
                                        Metriks kesehatan anda pada {""}{format(new Date(), "d MMMM yyyy", { locale: id })}
                                    </CardDescription>
                                </div>

                                

                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                                {wellnessStats.map((stat) => (
                                    <div
                                    key={stat.title}
                                    className={cn(
                                        "p-4 rounded-lg transition-all duration-200 hover:scale-[1.02]",
                                        stat.bgColor
                                    )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <stat.icon className={cn("w-5 h-5", stat.color)} />
                                            <p className="text-sm font-medium">{stat.title}</p>
                                        </div>
                                        <p className="text-2xl font-bold mt-2">{stat.value}</p>
                                        <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>


                {/* Content Grid untuk Games */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        {/* Game Kecemasan */}
                        <AnxietyGames />
                    </div>
                </div>
            </div>
            </Container>

            {/* Mood Tracking Modal */}
            <Dialog open={showMoodModal} onOpenChange={setShowMoodModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Apa yang anda rasakan?</DialogTitle>
                        <DialogDescription>
                            Geser slider untuk menemukan mood anda saat ini
                        </DialogDescription>
                    </DialogHeader>
                    {/* Mood Form */}
                    <MoodForm onSubmit={handleMoodSubmit} isLoading={isSavingMood} />
                </DialogContent>
            </Dialog>

            {/* Activity Logger */}
            <ActivityLogger 
                open={showActivityLogger}
                onOpenChange={setShowActivityLogger}
            />
        </div>
    )
}