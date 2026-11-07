import { Link } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export function LandingPage() {
  const { data: session } = authClient.useSession();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(47,107,80,0.25),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(180,83,9,0.2),transparent_30%),linear-gradient(180deg,rgba(28,23,18,0.08),transparent_40%)]"
      />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <p className="font-display text-5xl leading-tight text-forest md:text-7xl">
          LifeQuest
        </p>
        <h1 className="mt-4 max-w-2xl text-2xl font-semibold text-ink md:text-3xl">
          Turn your real goals into a long campaign worth playing.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-steel">
          Create a character, embark on campaigns, complete quests and habits,
          earn XP, defeat bosses, and grow attributes that mirror the life you
          want to build.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {session ? (
            <Link className="btn btn-primary" to="/app">
              Enter the campaign
            </Link>
          ) : (
            <>
              <Link className="btn btn-primary" to="/register">
                Begin your campaign
              </Link>
              <Link className="btn btn-secondary" to="/login">
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
