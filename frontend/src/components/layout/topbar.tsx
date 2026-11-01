"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search, Settings, LogOut, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/api";

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    auth.me().then((u) => setUserName(u.name)).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("scout_token");
    router.push("/login");
  };

  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6 shrink-0 z-30">
      <div className="flex items-center gap-3">
        {title && <h1 className="text-sm font-medium text-foreground">{title}</h1>}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-8 h-8 w-56 text-xs bg-secondary border-0" placeholder="Search missions..." />
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>

        {/* Profile dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 h-8 pl-1.5 pr-2 rounded-full hover:bg-secondary transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-white">
              {initials}
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-popover shadow-lg overflow-hidden z-50">
              <div className="px-3 py-3 border-b border-border">
                <div className="text-sm font-medium truncate text-foreground">{userName}</div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">Signed in</div>
              </div>
              <Link href="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <Link href="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <User className="h-4 w-4" />
                Profile
              </Link>
              <div className="border-t border-border">
                <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-destructive/10 transition-colors">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
