import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ProgressBar } from "../components/ProgressBar";
import { api } from "../lib/api";

type SheetResponse = {
  sheet: {
    character: {
      name: string;
      className: string;
      race: string;
      level: number;
      characterXp: number;
      levelProgress: {
        xpIntoLevel: number;
        xpToNext: number;
        progressRatio: number;
      };
    };
  } | null;
};

type CampaignsResponse = { campaigns: Array<{ id: string; title: string; status: string }> };
type StatsResponse = {
  totals: {
    questsCompleted: number;
    habitCompletions: number;
    goldEarned: number;
  };
};

export function DashboardPage() {
  const sheetQuery = useQuery({
    queryKey: ["sheet"],
    queryFn: () => api<SheetResponse>("/api/characters/active/sheet"),
  });
  const campaignsQuery = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => api<CampaignsResponse>("/api/campaigns"),
  });
  const statsQuery = useQuery({
    queryKey: ["stats"],
    queryFn: () => api<StatsResponse>("/api/stats"),
  });

  const sheet = sheetQuery.data?.sheet;
  if (sheetQuery.isLoading) {
    return <p className="text-steel">Loading your parchment…</p>;
  }

  if (!sheet) {
    return (
      <div className="panel rounded-xl p-8">
        <h1 className="font-display text-3xl text-forest">No character yet</h1>
        <p className="mt-2 text-steel">
          Forge your adventurer before the campaign begins.
        </p>
        <Link className="btn btn-primary mt-6 inline-flex" to="/app/character/new">
          Create character
        </Link>
      </div>
    );
  }

  const { character } = sheet;
  const campaigns = campaignsQuery.data?.campaigns ?? [];
  const totals = statsQuery.data?.totals;

  return (
    <div className="space-y-6">
      <section className="panel rounded-xl p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-mist">Active hero</p>
        <h1 className="mt-2 font-display text-4xl text-forest">{character.name}</h1>
        <p className="mt-1 text-steel">
          Level {character.level} {character.race} {character.className}
        </p>
        <div className="mt-4 max-w-md">
          <ProgressBar
            ratio={character.levelProgress.progressRatio}
            label={`XP ${character.levelProgress.xpIntoLevel} / ${character.levelProgress.xpToNext}`}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Quests completed", totals?.questsCompleted ?? "—"],
          ["Habit logs", totals?.habitCompletions ?? "—"],
          ["Gold earned", totals?.goldEarned ?? "—"],
        ].map(([label, value]) => (
          <div key={label} className="panel rounded-xl p-5">
            <p className="text-sm text-mist">{label}</p>
            <p className="mt-2 font-display text-3xl text-ink">{value}</p>
          </div>
        ))}
      </section>

      <section className="panel rounded-xl p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-forest">Campaigns</h2>
          <Link className="btn btn-secondary" to="/app/campaigns">
            Manage
          </Link>
        </div>
        {campaigns.length === 0 ? (
          <p className="mt-3 text-steel">No campaigns yet. Start your first arc.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {campaigns.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-parchment-deep/60"
                  to={`/app/campaigns/${c.id}`}
                >
                  <span className="font-semibold">{c.title}</span>
                  <span className="text-sm text-mist">{c.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
