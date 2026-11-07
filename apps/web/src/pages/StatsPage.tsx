import { useQuery } from "@tanstack/react-query";
import { ProgressBar } from "../components/ProgressBar";
import { api } from "../lib/api";

type Stats = {
  character: {
    name: string;
    level: number;
    characterXp: number;
    levelProgress: { progressRatio: number; xpIntoLevel: number; xpToNext: number };
  } | null;
  totals: {
    characterXp: number;
    goldEarned: number;
    questsCompleted: number;
    habitCompletions: number;
    campaigns: number;
  };
  skills: Array<{ id: string; name: string; rank: number; skillXp: number }>;
  xpHistory: Array<{ day: string; amount: number }>;
};

export function StatsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api<Stats>("/api/stats"),
  });

  if (isLoading) return <p className="text-steel">Calculating omens…</p>;
  if (!data?.character) {
    return <p className="text-steel">Create a character to see statistics.</p>;
  }

  const maxDay = Math.max(1, ...data.xpHistory.map((d) => d.amount));

  return (
    <div className="space-y-6">
      <section className="panel rounded-xl p-6">
        <h1 className="font-display text-3xl text-forest">Statistics</h1>
        <p className="mt-2 text-steel">
          {data.character.name} · Level {data.character.level}
        </p>
        <div className="mt-4 max-w-md">
          <ProgressBar
            ratio={data.character.levelProgress.progressRatio}
            label={`XP ${data.character.levelProgress.xpIntoLevel}/${data.character.levelProgress.xpToNext}`}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total XP", data.totals.characterXp],
          ["Gold earned", data.totals.goldEarned],
          ["Quests", data.totals.questsCompleted],
          ["Habits logged", data.totals.habitCompletions],
          ["Campaigns", data.totals.campaigns],
        ].map(([label, value]) => (
          <div key={label as string} className="panel rounded-xl p-4">
            <p className="text-sm text-mist">{label}</p>
            <p className="mt-2 font-display text-2xl">{value}</p>
          </div>
        ))}
      </section>

      <section className="panel rounded-xl p-5">
        <h2 className="font-display text-2xl text-forest">XP by day</h2>
        {data.xpHistory.length === 0 ? (
          <p className="mt-3 text-steel">No XP history yet.</p>
        ) : (
          <div className="mt-4 flex h-40 items-end gap-2 overflow-x-auto">
            {data.xpHistory.map((day) => (
              <div key={day.day} className="flex min-w-10 flex-col items-center gap-1">
                <div
                  className="w-8 rounded-t bg-forest"
                  style={{ height: `${(day.amount / maxDay) * 100}%` }}
                  title={`${day.amount} XP`}
                />
                <span className="text-[10px] text-mist">{day.day.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel rounded-xl p-5">
        <h2 className="font-display text-2xl text-forest">Skill ranks</h2>
        <ul className="mt-4 grid gap-2 md:grid-cols-2">
          {data.skills
            .slice()
            .sort((a, b) => b.skillXp - a.skillXp)
            .map((skill) => (
              <li
                key={skill.id}
                className="flex items-center justify-between rounded-md bg-white/40 px-3 py-2"
              >
                <span>{skill.name}</span>
                <span className="text-sm text-mist">
                  Rank {skill.rank} · {skill.skillXp} XP
                </span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
