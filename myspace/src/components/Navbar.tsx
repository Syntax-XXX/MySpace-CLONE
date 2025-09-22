"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "../lib/supabaseClient";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const onLogout = async () => {
    await supabase?.auth.signOut();
    router.replace("/auth/login");
  };

  useEffect(() => {
    if (!supabase) return;
    async function load() {
      const r = await supabase.auth.getUser();
      setUser(r.data.user);
    }
    load();
  }, [supabase]);

  return (
    <header className="myspace-topbar">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold text-white drop-shadow-sm">
              MySpace
            </Link>
            <nav className="hidden md:flex items-center gap-3 text-sm text-white">
              <Link href="/feed" className="px-2 py-1 rounded hover:bg-blue-800">
                Feed
              </Link>
              <Link href="/friends" className="px-2 py-1 rounded hover:bg-blue-800">
                Friends
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            {user ? (
              <div className="relative flex items-center gap-2">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="hidden sm:inline-flex items-center gap-2 px-2 py-1 rounded hover:bg-blue-800 text-white"
                >
                  <img
                    src={`/api/avatars/${user.id}`}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover bg-gray-200"
                  />
                  <span className="text-sm">{user.email?.split("@")[0]}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-white text-gray-900 border rounded shadow-md w-48 z-50">
                    <Link href="/profile" className="block px-3 py-2 hover:bg-gray-50">My Profile</Link>
                    <Link href="/profile/settings" className="block px-3 py-2 hover:bg-gray-50">Settings</Link>
                    <button onClick={onLogout} className="w-full text-left px-3 py-2 hover:bg-gray-50">Logout</button>
                  </div>
                )}

                {/* mobile hamburger */}
                <button
                  onClick={() => setOpen(!open)}
                  className="md:hidden p-2 rounded hover:bg-gray-100"
                >
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={
                        open
                          ? "M6 18L18 6M6 6l12 12"
                          : "M4 6h16M4 12h16M4 18h16"
                      }
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-sm px-3 py-1 border rounded"
                >
                  Sign in
                </Link>
                <button
                  onClick={() => setOpen(!open)}
                  className="md:hidden p-2 rounded hover:bg-gray-100"
                >
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={
                        open
                          ? "M6 18L18 6M6 6l12 12"
                          : "M4 6h16M4 12h16M4 18h16"
                      }
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* mobile menu */}
        <div
          className={`md:hidden transition-max-h duration-200 overflow-hidden ${
            open ? "max-h-40" : "max-h-0"
          }`}
        >
          <nav className="flex flex-col gap-2 py-3">
            <Link
              href="/feed"
              className="px-2 py-1 rounded hover:bg-blue-800 text-white"
            >
              Feed
            </Link>
            <Link
              href="/friends"
              className="px-2 py-1 rounded hover:bg-blue-800 text-white"
            >
              Friends
            </Link>
            {user ? (
              <Link
                href={`/profile/${user.id}`}
                className="px-2 py-1 rounded hover:bg-blue-800 text-white"
              >
                My Profile
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="px-2 py-1 rounded hover:bg-blue-800 text-white"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}