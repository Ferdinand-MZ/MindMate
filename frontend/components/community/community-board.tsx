"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, ArrowRight, Loader2, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCommunityPosts } from "@/lib/api/features";
import Link from "next/link";

type ReactionType = "heart" | "hug" | "strength" | "peace" | "sparkle";

const REACTION_EMOJI: Record<ReactionType, string> = {
  heart: "❤️", hug: "🤗", strength: "💪", peace: "☮️", sparkle: "✨",
};

interface Post {
  id: string;
  content: string;
  reactions: Record<ReactionType, number>;
  createdAt: string;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  return `${Math.floor(hours / 24)}h lalu`;
}

function topReactions(reactions: Record<ReactionType, number>) {
  return (Object.entries(reactions) as [ReactionType, number][])
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k, v]) => ({ emoji: REACTION_EMOJI[k], count: v }));
}

export function CommunityBoard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCommunityPosts(1)
      .then((data) => {
        setPosts(data.data?.slice(0, 3) ?? []);
        setTotal(data.pagination?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="border-primary/10 overflow-hidden h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-rose-500/5 to-transparent pointer-events-none z-0" />
      <CardContent className="p-6 relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Papan Komunitas</h3>
              <p className="text-xs text-muted-foreground">
                {total > 0 ? `${total} postingan anonim` : "Berbagi secara anonim"}
              </p>
            </div>
          </div>
        </div>

        {/* Preview posts */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2 text-center">
              <Users className="w-6 h-6 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">Belum ada postingan</p>
            </div>
          ) : (
            <div className="space-y-2.5 mb-4">
              {posts.map((post) => {
                const reacts = topReactions(post.reactions);
                return (
                  <div
                    key={post.id}
                    className="bg-muted/30 border border-border/40 rounded-xl p-3"
                  >
                    <p className="text-xs leading-relaxed text-foreground/80 line-clamp-2 mb-2">
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {reacts.length > 0
                          ? reacts.map((r, i) => (
                              <span key={i} className="text-xs">
                                {r.emoji} {r.count}
                              </span>
                            ))
                          : <span className="text-xs text-muted-foreground/50">belum ada reaksi</span>
                        }
                      </div>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-2 mt-auto">
          <Button asChild className="w-full bg-pink-600 hover:bg-pink-700 text-white">
            <Link href="/community">
              <Heart className="w-4 h-4 mr-2" />
              Buka papan komunitas
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}