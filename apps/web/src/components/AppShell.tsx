import { NavLink, Outlet } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import clsx from "clsx";

const links = [
  { to: "/app", label: "Dashboard", end: true },
  { to: "/app/character", label: "Character" },
  { to: "/app/campaigns", label: "Campaigns" },
  { to: "/app/inventory", label: "Inventory" },
  { to: "/app/journal", label: "Journal" },
  { to: "/app/achievements", label: "Achievements" },
  { to: "/app/stats", label: "Stats" },
  { to: "/app/settings", label: "Settings" },
];

export function AppShell() {
  const { data: session } = authClient.useSession();

  return (
    <div className="min-h-screen">
      <header className="border-b border-mist/40 bg-[#f6ead3]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-display text-2xl text-forest">LifeQuest</p>
            <p className="text-sm text-mist">
              {session?.user.name ?? "Adventurer"}
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => authClient.signOut()}
            type="button"
          >
            Sign out
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                clsx(
                  "rounded-md px-3 py-2 text-sm font-semibold whitespace-nowrap transition",
                  isActive
                    ? "bg-forest text-parchment"
                    : "text-steel hover:bg-parchment-deep/70",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
