import Link from "next/link";

export default function Home() {
  return (
    <div>
      <header className="myspace-topbar">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <h1 className="font-bold text-xl">MySpace</h1>
          <nav className="space-x-3">
            <Link href="/auth/login" className="text-white underline">
              Login
            </Link>
            <Link href="/auth/signup" className="text-white">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 px-4">
        <section className="card mb-6">
          <h2 className="text-2xl font-bold mb-2">Welcome to MySpace</h2>
          <p className="text-sm text-gray-700">
            Classic 2005 vibes — create an account, customize your profile, add
            friends, and post.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold mb-2">Features</h3>
            <ul className="text-sm list-disc pl-5 text-gray-700">
              <li>Profiles, Friends, Comments, and Music</li>
              <li>Real-time updates via Supabase</li>
              <li>Classic MySpace styling</li>
            </ul>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2">Get started</h3>
            <div className="flex gap-2">
              <Link
                href="/auth/signup"
                className="bg-[#1e90ff] text-white px-3 py-2 rounded"
              >
                Create account
              </Link>
              <Link href="/auth/login" className="border px-3 py-2 rounded">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
