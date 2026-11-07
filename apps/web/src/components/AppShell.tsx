import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { api, mediaUrl } from "../lib/api";
import { authClient } from "../lib/auth-client";

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

type SheetChip = {
  sheet: {
    character: {
      id: string;
      name: string;
      level: number;
      className: string;
      hasPortrait: boolean;
      portraitUrl: string | null;
    };
  } | null;
};

export function AppShell() {
  const { data: session } = authClient.useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["sheet"],
    queryFn: () => api<SheetChip>("/api/characters/active/sheet"),
  });

  const character = data?.sheet?.character;
  const portraitSrc = mediaUrl(character?.portraitUrl);

  function closeMobile() {
    setMobileOpen(false);
  }

  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-parchment">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="font-display text-2xl text-gold-bright">LifeQuest</p>
        <p className="mt-1 text-xs text-parchment/60">Interactive grimoire</p>
      </div>

      <div className="mx-4 mt-5 flex items-center gap-3 rounded-xl border border-gold/30 bg-sidebar-mid/80 px-3 py-3">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-gold/50">
          {portraitSrc ? (
            <img
              src={portraitSrc}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-arcane/40 font-display text-sm text-gold-bright">
              {(character?.name ?? session?.user.name ?? "A")
                .slice(0, 1)
                .toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-sm text-parchment">
            {character?.name ?? session?.user.name ?? "Adventurer"}
          </p>
          <p className="truncate text-xs text-parchment/55">
            {character
              ? `Lv. ${character.level} ${character.className}`
              : "No character yet"}
          </p>
        </div>
      </div>

      <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={closeMobile}
            className={({ isActive }) =>
              clsx(
                "block rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                isActive
                  ? "bg-arcane/45 text-parchment shadow-[0_0_18px_rgba(139,92,246,0.35)]"
                  : "text-parchment/70 hover:bg-white/5 hover:text-parchment",
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <p className="mb-3 px-1 text-xs italic text-parchment/45">
          “Every quest begins with a single step.”
        </p>
        <button
          className="btn w-full border border-parchment/25 bg-transparent text-parchment hover:bg-white/5"
          onClick={() => authClient.signOut()}
          type="button"
        >
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="grimoire-shell min-h-screen lg:flex">
      <div className="hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:shrink-0">
        {sidebar}
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            type="button"
            onClick={closeMobile}
          />
          <div className="relative z-10 h-full shadow-2xl">{sidebar}</div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-mist/30 bg-[#f6ead3]/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            className="btn btn-secondary px-3 py-2"
            type="button"
            onClick={() => setMobileOpen(true)}
          >
            Menu
          </button>
          <p className="font-display text-lg text-forest">LifeQuest</p>
          <span className="w-16" />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
