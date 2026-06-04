"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getCommunityPosts,
  createCommunityPost,
  reactToPost,
  deleteCommunityPost,
} from "@/lib/api/features";

type ReactionType = "heart" | "hug" | "strength" | "peace" | "sparkle";

const REACTION_CONFIG: Record<
  ReactionType,
  { emoji: string; label: string }
> = {
  heart: { emoji: "❤️", label: "Cinta" },
  hug: { emoji: "🤗", label: "Peluk" },
  strength: { emoji: "💪", label: "Kuat" },
  peace: { emoji: "☮️", label: "Damai" },
  sparkle: { emoji: "✨", label: "Semangat" },
};

interface Post {
  _id: string;
  content: string;
  reactions: Record<ReactionType, number>;
  createdAt: string;
  isOwner?: boolean;
}

function PostCard({
  post,
  onReact,
  onDelete,
}: {
  post: Post;
  onReact: (postId: string, reaction: ReactionType) => void;
  onDelete: (postId: string) => void;
}) {
  const [reacting, setReacting] = useState<ReactionType | null>(null);
  const [localReactions, setLocalReactions] = useState(post.reactions);
  const [reactedWith, setReactedWith] = useState<Set<ReactionType>>(new Set());
  const [showDelete, setShowDelete] = useState(false);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "baru saja";
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    return `${Math.floor(hours / 24)} hari lalu`;
  };

  const handleReact = async (reaction: ReactionType) => {
    if (reacting || reactedWith.has(reaction)) return;
    setReacting(reaction);
    setLocalReactions((prev) => ({
      ...prev,
      [reaction]: (prev[reaction] || 0) + 1,
    }));
    setReactedWith((prev) => new Set([...prev, reaction]));
    try {
      await onReact(post._id, reaction);
    } catch {
      // Revert on error
      setLocalReactions(post.reactions);
      setReactedWith((prev) => {
        const n = new Set(prev);
        n.delete(reaction);
        return n;
      });
    } finally {
      setReacting(null);
    }
  };

  const totalReactions = Object.values(localReactions).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-muted/30 border border-border/50 rounded-2xl p-4 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Anonymous avatar — deterministic but non-identifying */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-60 flex items-center justify-center text-white text-xs font-bold select-none">
            ?
          </div>
          <span className="text-xs text-muted-foreground">
            Anonim · {timeAgo(post.createdAt)}
          </span>
        </div>
        {post.isOwner && (
          <button
            onClick={() => setShowDelete(!showDelete)}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm leading-relaxed mb-3">{post.content}</p>

      {/* Delete confirm */}
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center justify-between">
              <span className="text-xs text-destructive">Hapus postingan ini?</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-6 px-2"
                  onClick={() => setShowDelete(false)}
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  className="text-xs h-6 px-2 bg-destructive hover:bg-destructive/90 text-white"
                  onClick={() => onDelete(post._id)}
                >
                  Hapus
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reactions */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((key) => {
          const count = localReactions[key] || 0;
          const reacted = reactedWith.has(key);
          return (
            <button
              key={key}
              onClick={() => handleReact(key)}
              disabled={!!reacting}
              title={REACTION_CONFIG[key].label}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                reacted
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-border/50 hover:border-primary/30 hover:bg-primary/5 text-muted-foreground"
              } ${reacting === key ? "opacity-60" : ""}`}
            >
              <span>{REACTION_CONFIG[key].emoji}</span>
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}
        {totalReactions > 0 && (
          <span className="text-xs text-muted-foreground self-center ml-1">
            {totalReactions} reaksi
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function CommunityBoard() {
  const [expanded, setExpanded] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCrisisMessage, setIsCrisisMessage] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadPosts = useCallback(
    async (p = 1) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCommunityPosts(p);
        if (p === 1) {
          setPosts(data.data);
        } else {
          setPosts((prev) => [...prev, ...data.data]);
        }
        setHasMore(p < data.pagination.pages);
        setPage(p);
      } catch {
        setError("Gagal memuat postingan");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (expanded && posts.length === 0) {
      loadPosts(1);
    }
  }, [expanded, posts.length, loadPosts]);

  const handleSubmit = async () => {
    if (!newPost.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = await createCommunityPost(newPost.trim());
      setPosts((prev) => [{ ...data.data, isOwner: true }, ...prev]);
      setNewPost("");
      setShowCompose(false);
    } catch (err: any) {
      if (err.isCrisis) {
        setIsCrisisMessage(true);
      }
      setError(err.message || "Gagal memposting");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReact = async (postId: string, reaction: ReactionType) => {
    await reactToPost(postId, reaction);
  };

  const handleDelete = async (postId: string) => {
    try {
      await deleteCommunityPost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch {
      // Silent fail
    }
  };

  return (
    <Card className="border-primary/10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-rose-500/5 to-transparent pointer-events-none z-0" />
      <CardContent className="p-6 relative z-10">
        <button
          className="w-full flex items-start justify-between gap-3 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Papan Komunitas</h3>
              <p className="text-xs text-muted-foreground">
                Berbagi & mendukung secara anonim — tanpa komentar, hanya reaksi
              </p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground mt-3" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground mt-3" />
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-5 space-y-4">
                {/* Safety notice */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Ruang ini anonim sepenuhnya. Berbagi hanya yang ingin kamu
                    bagikan. Tidak ada komentar — hanya reaksi dukungan. Jika kamu
                    dalam krisis, hubungi 119 ext 8.
                  </p>
                </div>

                {/* Compose */}
                <div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCompose(!showCompose)}
                    className="border-pink-500/30 text-pink-600 dark:text-pink-400 hover:bg-pink-500/10 mb-3"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Berbagi pikiran
                  </Button>

                  <AnimatePresence>
                    {showCompose && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-muted/20 border border-border rounded-2xl p-4 mb-4">
                          <Textarea
                            placeholder="Tulis pikiranmu di sini... Maksimal 280 karakter."
                            value={newPost}
                            onChange={(e) =>
                              setNewPost(e.target.value.slice(0, 280))
                            }
                            className="mb-2 min-h-[80px] resize-none text-sm border-pink-500/20 focus-visible:ring-pink-500/30"
                          />
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs ${
                                newPost.length > 250
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {newPost.length}/280
                            </span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setShowCompose(false);
                                  setNewPost("");
                                }}
                                className="text-xs"
                              >
                                Batal
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSubmit}
                                disabled={!newPost.trim() || submitting}
                                className="text-xs bg-pink-600 hover:bg-pink-700 text-white"
                              >
                                {submitting ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <Send className="w-3 h-3 mr-1" />
                                )}
                                Kirim
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {error && (
                  <div className={`text-xs text-center rounded-lg p-3 ${
                    isCrisisMessage
                      ? "bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300"
                      : "text-destructive"
                  }`}>
                    {isCrisisMessage && <span className="font-semibold block mb-1">💙 Perhatian</span>}
                    {error}
                  </div>
                )}

                {/* Posts */}
                {loading && posts.length === 0 ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Belum ada postingan. Jadilah yang pertama!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    <AnimatePresence>
                      {posts.map((post) => (
                        <PostCard
                          key={post._id}
                          post={post}
                          onReact={handleReact}
                          onDelete={handleDelete}
                        />
                      ))}
                    </AnimatePresence>
                    {hasMore && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground"
                        onClick={() => loadPosts(page + 1)}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Muat lebih banyak"
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}