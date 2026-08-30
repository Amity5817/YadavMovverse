"use client";

import Link from "next/link";
import { Search, Bell, User } from "lucide-react";

export default function Header() {
  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-white/5 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        
        <Link
          href="/"
          className="text-2xl font-black tracking-tight"
        >
          Cine<span className="text-red-500">Verse</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
          <Link href="/" className="text-white">
            Home
          </Link>

          <Link href="/movies" className="hover:text-white">
            Movies
          </Link>

          <Link href="/tv-series" className="hover:text-white">
            TV Series
          </Link>

          <Link href="/animation" className="hover:text-white">
            Animation
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="rounded-full p-2 hover:bg-white/10"
          >
            <Search size={20} />
          </Link>

          <button className="hidden rounded-full p-2 hover:bg-white/10 sm:block">
            <Bell size={20} />
          </button>

          <button className="hidden rounded-full bg-white/10 p-2 sm:block">
            <User size={19} />
          </button>
        </div>

      </div>
    </header>
  );
}