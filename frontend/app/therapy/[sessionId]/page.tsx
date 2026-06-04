"use client";
import { useEffect, useRef, useState } from "react";
import { MoodForm } from "@/components/mood/mood-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  PlusCircle,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Mic, // Tambahkan ikon Mic
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  createChatSession,
  sendChatMessage,
  getChatHistory,
  ChatMessage,
  getAllChatSessions,
  deleteChatSession,
  ChatSession,
} from "@/lib/api/chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface SuggestedQuestion {
  id: string;
  text: string;
}

interface StressPrompt {
  trigger: string;
  activity: {
    type: "breathing" | "garden" | "forest" | "waves";
    title: string;
    description: string;
  };
}

const SUGGESTED_QUESTIONS = [
  { id: "1", text: "Bagaimana cara mengelola kecemasan saya dengan lebih baik?" },
  { id: "2", text: "Akhir-akhir ini saya merasa sangat terbebani" },
  { id: "3", text: "Bisakah kita membahas cara meningkatkan kualitas tidur?" },
  { id: "4", text: "Saya butuh bantuan untuk keseimbangan kerja dan kehidupan" },
];

const glowAnimation = {
  initial: { opacity: 0.5, scale: 1 },
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.05, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export default function TherapyPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const params = useParams();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // State untuk status perekaman
  const [isAssessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(
    params.sessionId as string
  );
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null); // Ref untuk SpeechRecognition

  // Inisialisasi Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = "id-ID"; // Bahasa Indonesia
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setMessage(transcript); // Set teks transkripsi ke input
          setIsRecording(false);
          // Otomatis submit pesan
          const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
          handleSubmit(fakeEvent);
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
          setMessage("Maaf, gagal merekam suara.");
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNewSession = async () => {
    try {
      setIsLoading(true);
      const newSessionId = await createChatSession();
      const newSession: ChatSession = {
        sessionId: newSessionId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setSessionId(newSessionId);
      setMessages([]);
      router.push(`/therapy/${newSessionId}`);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to create new session:", error);
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionIdToDelete: string) => {
    try {
      setIsLoading(true);
      await deleteChatSession(sessionIdToDelete);
      setSessions((prev) =>
        prev.filter((s) => s.sessionId !== sessionIdToDelete)
      );
      if (sessionIdToDelete === sessionId) {
        setSessionId(null);
        setMessages([]);
        router.push("/therapy/new");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialMessageKey = `mindmate_initial_message_${params.sessionId}`;
    const initialMessage = localStorage.getItem(initialMessageKey);
    if (initialMessage) {
      setMessage(initialMessage);
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSubmit(fakeEvent);
        localStorage.removeItem(initialMessageKey);
      }, 100);
    }
  }, [params.sessionId]);

  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);
        if (!sessionId || sessionId === "new") {
          const newSessionId = await createChatSession();
          setSessionId(newSessionId);
          router.push(`/therapy/${newSessionId}`);
        } else {
          const history = await getChatHistory(sessionId);
          if (Array.isArray(history)) {
            const formattedHistory = history.map((msg) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }));
            setMessages(formattedHistory);
          } else {
            setMessages([]);
          }
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        setMessages([
          {
            role: "assistant",
            content:
              "Mohon maaf, saya mengalami kendala saat memuat sesi obrolan.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    initChat();
  }, [sessionId]);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const allSessions = await getAllChatSessions();
        setSessions(allSessions);
      } catch (error) {
        console.error("Failed to load sessions:", error);
      }
    };
    loadSessions();
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }
  };

  useEffect(() => {
    if (!isTyping) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentMessage = message.trim();
    if (!currentMessage || isTyping || !sessionId) return;

    setMessage("");
    setIsTyping(true);

    const userMessage: ChatMessage = {
      role: "user",
      content: currentMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const aiResponse = await sendChatMessage(sessionId, currentMessage);
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content:
          aiResponse.response ||
          aiResponse.message ||
          "Maaf, saya tidak dapat memproses itu saat ini.",
        timestamp: new Date(),
        metadata: aiResponse.metadata,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === sessionId
            ? {
                ...s,
                messages: [...s.messages, userMessage, assistantMessage],
                updatedAt: new Date(),
              }
            : s
        )
      );
    } catch (error) {
      console.error("Gagal mengirim atau menerima pesan chat:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Mohon maaf, terjadi kesalahan saat menghubungi MindMate.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Fungsi untuk memulai/berhenti merekam suara
  const handleToggleRecording = () => {
    if (!recognitionRef.current) {
      setMessage("Speech recognition tidak didukung di browser ini.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const handleSuggestedQuestion = async (text: string) => {
    if (!sessionId) {
      const newSessionId = await createChatSession();
      setSessionId(newSessionId);
      router.push(`/therapy/${newSessionId}`);
    }
    setMessage(text);
    setTimeout(() => {
      const event = new Event("submit") as unknown as React.FormEvent;
      handleSubmit(event);
    }, 0);
  };

  const handleSessionSelect = async (selectedSessionId: string) => {
    if (selectedSessionId === sessionId) return;

    try {
      setIsLoading(true);
      const history = await getChatHistory(selectedSessionId);
      if (Array.isArray(history)) {
        const formattedHistory = history.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(formattedHistory);
        setSessionId(selectedSessionId);
        router.push(`/therapy/${selectedSessionId}`);
      }

      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-auto bg-background">
      <div
        className={cn(
          "fixed top-0 right-0 z-30 bg-background/95 backdrop-blur border-b transition-all duration-300",
          isSidebarOpen ? "left-80 lg:left-80" : "left-0"
        )}
      >
        <div className="mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold">MindMate</h2>
                <p className="text-sm text-muted-foreground">
                  {messages.length} pesan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isSidebarOpen && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={cn(
            "fixed top-20 z-50 h-11 w-11 rounded-full shadow-lg border-2 bg-background",
            "hover:bg-primary hover:text-primary-foreground hover:border-primary",
            "transition-all duration-300 left-4"
          )}
          title="Buka Sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </Button>
      )}

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : -320,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-16 left-0 w-80 h-[calc(100vh-4rem)] border-r bg-background z-50 lg:z-20 shadow-lg"
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Sesi Obrolan</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewSession}
                  className="hover:bg-primary/10"
                  disabled={isLoading}
                  title="Sesi Baru"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <PlusCircle className="w-5 h-5" />
                  )}
                </Button>
                {isSidebarOpen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(false)}
                    className="hover:bg-primary/10 lg:hidden"
                    title="Tutup Sidebar"
                  >
                    <PanelLeftClose className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleNewSession}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              Sesi Baru
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-3 py-4 space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Belum ada sesi obrolan</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className={cn(
                      "p-3 rounded-lg text-sm cursor-pointer transition-all duration-200 border",
                      session.sessionId === sessionId
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-secondary/10 border-transparent hover:bg-primary/5 hover:border-primary/10",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={
                      isLoading
                        ? undefined
                        : () => handleSessionSelect(session.sessionId)
                    }
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span className="font-medium truncate">
                          {session.messages[0]?.content.slice(0, 30) ||
                            "Obrolan Baru"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.sessionId);
                        }}
                        className="hover:bg-red-100 hover:text-red-600 h-7 w-7 flex-shrink-0"
                        disabled={isLoading}
                        title="Hapus Sesi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground mb-2 pl-6">
                      {session.messages[session.messages.length - 1]?.content ||
                        "Belum ada pesan"}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pl-6">
                      <span>{session.messages.length} pesan</span>
                      <span>
                        {(() => {
                          try {
                            const dateStr =
                              session.updatedAt || session.createdAt;
                            if (!dateStr) return "Baru";
                            const date = new Date(dateStr);
                            if (isNaN(date.getTime())) return "Baru";
                            const now = new Date();
                            const diffMs = now.getTime() - date.getTime();
                            const diffMinutes = Math.floor(diffMs / 60000);
                            if (diffMinutes < 1) return "Baru saja";
                            if (diffMinutes < 60) return `${diffMinutes}m lalu`;
                            const diffHours = Math.floor(diffMinutes / 60);
                            if (diffHours < 24) return `${diffHours}j lalu`;
                            const diffDays = Math.floor(diffHours / 24);
                            return `${diffDays}h lalu`;
                          } catch (error) {
                            return "Baru";
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </motion.div>

      <div
        className={cn(
          "pt-24 pb-20 transition-all duration-300",
          isSidebarOpen ? "ml-0 lg:ml-80" : "ml-0"
        )}
      >
        <div className="flex flex-col min-h-[calc(100vh-5rem)]">
          <div className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center px-4">
                <div className="w-full max-w-3xl mx-auto space-y-8">
                  <div className="text-center space-y-4">
                    <div className="relative inline-flex flex-col items-center">
                      <motion.div
                        className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"
                        initial="initial"
                        animate="animate"
                        variants={glowAnimation}
                      />
                      <div className="relative flex items-center gap-2 text-2xl font-semibold">
                        <div className="relative">
                          <Sparkles className="w-6 h-6 text-primary" />
                          <motion.div
                            className="absolute inset-0 text-primary"
                            initial="initial"
                            animate="animate"
                            variants={glowAnimation}
                          >
                            <Sparkles className="w-6 h-6" />
                          </motion.div>
                        </div>
                        <span className="bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
                          MindMate
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-2">
                        Ada yang bisa saya bantu hari ini?
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 relative">
                    <motion.div
                      className="absolute -inset-4 bg-gradient-to-b from-primary/5 to-transparent blur-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    />
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: parseFloat(q.id) * 0.1 + 0.5 }}
                      >
                        <Button
                          variant="outline"
                          className="w-full h-auto py-4 px-6 text-left justify-start hover:bg-muted/50 hover:border-primary/50 transition-all duration-300 text-sm sm:text-base break-words whitespace-normal"
                          onClick={() => handleSuggestedQuestion(q.text)}
                        >
                          <span className="block w-full">{q.text}</span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div ref={chatContainerRef} className="max-w-4xl mx-auto">
                <AnimatePresence initial={false}>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={`${msg.timestamp.toISOString()}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "px-4 sm:px-6 py-6 sm:py-8",
                        msg.role === "assistant"
                          ? "bg-muted/30"
                          : "bg-background"
                      )}
                    >
                      <div className="flex gap-3 sm:gap-4">
                        <div className="w-8 h-8 shrink-0 mt-1">
                          {msg.role === "assistant" ? (
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                              <Bot className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2 overflow-hidden min-h-[2rem]">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="font-medium text-sm">
                              {msg.role === "assistant" ? "MindMate" : "You"}
                            </p>
                            {msg.metadata?.technique && (
                              <Badge variant="secondary" className="text-xs">
                                {msg.metadata.technique}
                              </Badge>
                            )}
                          </div>
                          <div className="prose prose-sm dark:prose-invert leading-relaxed max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                          {msg.metadata?.goal && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Tujuan: {msg.metadata.goal}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 sm:px-6 py-6 sm:py-8 flex gap-3 sm:gap-4 bg-muted/30"
                  >
                    <div className="w-8 h-8 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="font-medium text-sm">MindMate</p>
                      <p className="text-sm text-muted-foreground">
                        Sedang mengetik...
                      </p>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} className="h-px" />
              </div>
            )}
          </div>

          <div
            className={cn(
              "border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 p-4 fixed bottom-0 right-0 z-20 transition-all duration-300",
              isSidebarOpen ? "left-0 lg:left-80" : "left-0"
            )}
          >
            <form
              onSubmit={handleSubmit}
              className="max-w-4xl mx-auto flex gap-2 sm:gap-4 items-end"
            >
              <div className="flex-1 relative group">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tanyakan apa saja atau gunakan mikrofon..."
                  className={cn(
                    "w-full resize-none rounded-2xl border bg-background",
                    "p-3 pr-24 min-h-[48px] max-h-[200px]", // Tambah padding untuk tombol tambahan
                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                    "transition-all duration-200 text-sm sm:text-base",
                    "placeholder:text-muted-foreground/70",
                    (isTyping || isRecording) && "opacity-50 cursor-not-allowed"
                  )}
                  rows={1}
                  disabled={isTyping || isRecording}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  style={{ height: "auto" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height =
                      Math.min(target.scrollHeight, 200) + "px";
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    "absolute right-14 bottom-2 sm:bottom-3.5 h-[36px] w-[36px]", // Geser posisi untuk memberi ruang tombol mic
                    "rounded-xl transition-all duration-200",
                    "bg-primary hover:bg-primary/90",
                    "shadow-sm shadow-primary/20",
                    (isTyping || !message.trim()) &&
                      "opacity-50 cursor-not-allowed",
                    "group-hover:scale-105 group-focus-within:scale-105"
                  )}
                  disabled={isTyping || !message.trim() || isRecording}
                >
                  <Send className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  className={cn(
                    "absolute right-1.5 bottom-2 sm:bottom-3.5 h-[36px] w-[36px]",
                    "rounded-xl transition-all duration-200",
                    isRecording
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-secondary hover:bg-secondary/90",
                    "shadow-sm shadow-primary/20",
                    isTyping && "opacity-50 cursor-not-allowed",
                    "group-hover:scale-105 group-focus-within:scale-105"
                  )}
                  disabled={isTyping}
                  onClick={handleToggleRecording}
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </form>
            <div className="mt-2 text-xs text-center text-muted-foreground max-w-4xl mx-auto hidden sm:block">
              Tekan <kbd className="px-2 py-0.5 rounded bg-muted">Enter ↵</kbd>{" "}
              untuk mengirim,
              <kbd className="px-2 py-0.5 rounded bg-muted ml-1">
                Shift + Enter
              </kbd>{" "}
              untuk baris baru, atau gunakan mikrofon
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={isAssessmentModalOpen}
        onOpenChange={setAssessmentModalOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Asesmen Kesehatan Mental</DialogTitle>
          </DialogHeader>
          <MoodForm
            onFinished={() => {
              setAssessmentModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}