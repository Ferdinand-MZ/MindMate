"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  MessageCircle,
  BotMessageSquare,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { SignInButton } from "@/components/auth/sign-in-button";
import { useSession } from "@/lib/contexts/session-context";

// Nav items visible to everyone
const PUBLIC_NAV = [
  { href: "/features", label: "Fitur" },
  { href: "/about",    label: "Tentang" },
];

// Nav items only visible after login
const PROTECTED_NAV = [
  { href: "/wellness",   label: "Wellness" },
  { href: "/journal",    label: "Jurnal" },
  { href: "/community",  label: "Komunitas" },
];

export function Header() {
  const { isAuthenticated, logout } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const visibleNav = isAuthenticated
    ? [...PUBLIC_NAV, ...PROTECTED_NAV]
    : PUBLIC_NAV;

  return (
    <div className="w-full fixed top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="absolute inset-0 border-b border-primary/10" />
      <header className="relative max-w-6xl mx-auto px-3 sm:px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 transition-opacity hover:opacity-80"
          >
            <BotMessageSquare className="h-6 w-6 sm:h-7 sm:w-7 text-primary animate-pulse-gentle" />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-base sm:text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                MindMate
              </span>
              <span className="text-[10px] sm:text-xs dark:text-muted-foreground">
                Teman AI kesehatan mentalmu
              </span>
            </div>
          </Link>

          {/* Right section */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center space-x-1">
              {visibleNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />

              {isAuthenticated ? (
                <>
                  <Button
                    asChild
                    className="hidden md:flex gap-2 bg-primary/90 hover:bg-primary"
                  >
                    <Link href="/dashboard">
                      <MessageCircle className="w-4 h-4" />
                      Mulai
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={logout}
                    className="hidden sm:flex text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Keluar
                  </Button>
                </>
              ) : (
                <SignInButton />
              )}

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-primary/10 bg-background">
            <nav className="flex flex-col space-y-1 py-3 px-3">
              {visibleNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {isAuthenticated ? (
                <>
                  <Button asChild className="mt-2 w-full gap-2 bg-primary/90 hover:bg-primary">
                    <Link href="/dashboard">
                      <MessageCircle className="w-4 h-4" />
                      Mulai
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={logout}
                    className="mt-2 w-full text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Keluar
                  </Button>
                </>
              ) : (
                <div className="mt-2">
                  <SignInButton />
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
    </div>
  );
}