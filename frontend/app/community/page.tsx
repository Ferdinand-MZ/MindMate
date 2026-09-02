"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Send,
  Loader2,
  Trash2,
  AlertCircle,
  ArrowLeft,
  X,
  RefreshCw,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/contexts/session-context";
import {
  getCommunityPosts,
  createCommunityPost,
  reactToPost,
  deleteCommunityPost,
} from "@/lib/api/features";

// ─── Types ────────────────────────────────────────────────────────────────────
type ReactionType = "heart" | "hug" | "strength" | "peace" | "sparkle";

const REACTION_CONFIG: Record<ReactionType, { emoji: string; label: string }> = {
  heart:    { emoji: "❤️", label: "Cinta" },
  hug:      { emoji: "🤗", label: "Peluk" },
  strength: { emoji: "💪", label: "Kuat" },
  peace:    { emoji: "☮️", label: "Damai" },
  sparkle:  { emoji: "✨", label: "Semangat" },
};

// Pastel avatar colors : deterministic from anonId character sum
const AVATAR_PALETTES = [
  "from-violet-400 to-purple-500",
  "from-pink-400 to-rose-400",
  "from-sky-400 to-blue-500",
  "from-teal-400 to-emerald-400",
  "from-amber-400 to-orange-400",
  "from-fuchsia-400 to-pink-500",
];

interface Post {
  id: string;
  content: string;
  reactions: Record<ReactionType, number>;
  createdAt: string;
  isOwner?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "kemarin" : `${days} hari lalu`;
}

function avatarPalette(id: string) {
  const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTES[sum % AVATAR_PALETTES.length];
}

// ─── PostCard ─────────────────────────────────────────────────────────────────
function PostCard({
  post,
  onReact,
  onDelete,
}: {
  post: Post;
  onReact: (id: string, r: ReactionType) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [reacting, setReacting] = useState<ReactionType | null>(null);
  const [localReactions, setLocalReactions] = useState({ ...post.reactions });
  const [reactedWith, setReactedWith] = useState<Set<ReactionType>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const palette = avatarPalette(post.id);

  const handleReact = async (r: ReactionType) => {
    if (reacting || reactedWith.has(r)) return;
    setReacting(r);
    setLocalReactions((prev) => ({ ...prev, [r]: (prev[r] || 0) + 1 }));
    setReactedWith((prev) => new Set([...prev, r]));
    try {
      await onReact(post.id, r);
    } catch {
      setLocalReactions({ ...post.reactions });
      setReactedWith((prev) => { const n = new Set(prev); n.delete(r); return n; });
    } finally {
      setReacting(null);
    }
  };

  const total = Object.values(localReactions).reduce((a, b) => a + b, 0);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      layout
      className="group bg-card border border-border/60 rounded-2xl p-5 hover:border-primary/20 transition-colors"
    >
      {/* Meta row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${palette} opacity-75 flex items-center justify-center text-white text-xs font-bold select-none shrink-0`}>
            A
          </div>
          <span className="text-xs text-muted-foreground">
            Anonim · {timeAgo(post.createdAt)}
          </span>
        </div>
        {post.isOwner && !confirmDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
            title="Hapus postingan"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed text-foreground/90 mb-4 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="bg-destructive/8 border border-destructive/20 rounded-xl p-3 flex items-center justify-between gap-3">
              <span className="text-xs text-destructive/90 font-medium">Hapus postingan ini?</span>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setConfirmDelete(false)}>
                  Batal
                </Button>
                <Button
                  size="sm"
                  className="h-6 px-2 text-xs bg-destructive hover:bg-destructive/90 text-white"
                  onClick={() => onDelete(post.id)}
                >
                  Hapus
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reactions */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((key) => {
          const count = localReactions[key] || 0;
          const reacted = reactedWith.has(key);
          return (
            <button
              key={key}
              onClick={() => handleReact(key)}
              disabled={!!reacting}
              title={REACTION_CONFIG[key].label}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border transition-all duration-150 ${
                reacted
                  ? "bg-primary/10 border-primary/30 text-primary scale-105"
                  : "border-border/60 hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-foreground"
              } ${reacting === key ? "opacity-50" : ""}`}
            >
              <span className="leading-none">{REACTION_CONFIG[key].emoji}</span>
              {count > 0 && <span className="font-medium">{count}</span>}
            </button>
          );
        })}
        {total > 0 && (
          <span className="text-xs text-muted-foreground ml-1">{total} reaksi</span>
        )}
      </div>
    </motion.article>
  );
}

// ─── Compose modal ────────────────────────────────────────────────────────────
function ComposeModal({
  onClose,
  onPosted,
}: {
  onClose: () => void;
  onPosted: (post: Post) => void;
}) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCrisis, setIsCrisis] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    setIsCrisis(false);
    try {
      const data = await createCommunityPost(content.trim());
      onPosted({ ...data.data, isOwner: true });
      onClose();
    } catch (err: any) {
      if (err.isCrisis) setIsCrisis(true);
      setError(err.message || "Gagal memposting");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-pink-500/10 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-pink-500" />
            </div>
            <span className="font-semibold text-sm">Berbagi ke komunitas</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Privacy notice */}
          <div className="flex items-start gap-2.5 bg-muted/50 rounded-xl p-3">
            <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Postingan ini <strong>100% anonim</strong>. Tidak ada nama, foto, atau identitas yang terkait. Tidak ada komentar : hanya reaksi dukungan.
            </p>
          </div>

          {/* Textarea */}
          <div>
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 280))}
              placeholder="Apa yang ingin kamu bagikan hari ini? Tidak ada yang benar atau salah..."
              className="min-h-[130px] resize-none text-sm border-pink-500/20 focus-visible:ring-pink-500/30 leading-relaxed"
            />
            <div className="flex justify-between items-center mt-2">
              <span className={`text-xs ${content.length > 250 ? "text-destructive" : "text-muted-foreground"}`}>
                {content.length}/280
              </span>
              <span className="text-xs text-muted-foreground">Maks 5 postingan/hari</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={`text-xs rounded-xl p-3 ${
              isCrisis
                ? "bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300"
                : "bg-destructive/10 border border-destructive/20 text-destructive"
            }`}>
              {isCrisis && <p className="font-semibold mb-1">💙 Perhatian</p>}
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Batal</Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
              Kirim
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { isAuthenticated, loading: authLoading } = useSession();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login?redirect=/community");
  }, [isAuthenticated, authLoading, router]);

  const loadPosts = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    setError(null);
    try {
      const data = await getCommunityPosts(p);
      if (append) {
        setPosts((prev) => [...prev, ...data.data]);
      } else {
        setPosts(data.data);
      }
      setHasMore(p < data.pagination.pages);
      setPostCount(data.pagination.total);
      setPage(p);
    } catch {
      setError("Gagal memuat postingan. Coba lagi.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadPosts(1);
  }, [isAuthenticated, loadPosts]);

  const handlePosted = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
    setPostCount((c) => c + 1);
  };

  const handleReact = async (id: string, r: ReactionType) => {
    await reactToPost(id, r);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCommunityPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setPostCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  if (authLoading || (!isAuthenticated && !authLoading)) return null;

  return (
    <>
      {/* Compose modal */}
      <AnimatePresence>
        {showCompose && (
          <ComposeModal onClose={() => setShowCompose(false)} onPosted={handlePosted} />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-background">
        {/* Top bar */}
        <div className="fixed top-14 sm:top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b border-primary/10">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-pink-500/10 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-pink-500" />
                </div>
                <div>
                  <span className="font-semibold text-sm">Papan Komunitas</span>
                  {postCount > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">{postCount} postingan</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadPosts(1)}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <Button
                size="sm"
                onClick={() => setShowCompose(true)}
                className="bg-pink-600 hover:bg-pink-700 text-white gap-1.5 h-8 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Berbagi
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-[7.5rem] sm:pt-[8rem] pb-16 max-w-2xl mx-auto px-4">

          {/* Safety notice : sticky-ish, tipis */}
          <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/15 rounded-2xl p-3.5 mb-6">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500/80 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ruang ini <strong>anonim sepenuhnya</strong>. Tidak ada komentar : hanya reaksi dukungan.
              Jika kamu dalam krisis, hubungi <strong>119 ext 8</strong> (Into The Light, 24 jam).
            </p>
          </div>

          {/* Feed */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Memuat postingan...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button size="sm" variant="outline" onClick={() => loadPosts(1)}>Coba lagi</Button>
            </div>
          ) : posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-4 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-pink-400" />
              </div>
              <div>
                <p className="font-semibold text-base mb-1">Belum ada postingan</p>
                <p className="text-sm text-muted-foreground mb-4">Jadilah yang pertama berbagi!</p>
                <Button
                  size="sm"
                  onClick={() => setShowCompose(true)}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Berbagi sekarang
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onReact={handleReact}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>

              {/* Load more */}
              {hasMore && (
                <div className="pt-2 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadPosts(page + 1, true)}
                    disabled={loadingMore}
                    className="text-xs"
                  >
                    {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                    Muat lebih banyak
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}