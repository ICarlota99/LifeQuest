import { FormEvent, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProgressBar } from "../components/ProgressBar";
import { api } from "../lib/api";

type Quest = {
  id: string;
  title: string;
  description: string;
  questType: string;
  difficulty: number;
  status: string;
  estimatedEffortHours: number;
};
type Habit = {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  softStreak: number;
  status: string;
  estimatedEffortHours: number;
};
type Boss = {
  id: string;
  title: string;
  kind: string;
  maxHp: number;
  currentHp: number;
  status: string;
};

type Detail = {
  campaign: { id: string; title: string; narrative: string; mainObjective: string };
  quests: Quest[];
  habits: Habit[];
  bosses: Boss[];
};

type SheetResponse = {
  sheet: {
    attributes: Array<{
      skills: Array<{ id: string; name: string }>;
    }>;
  } | null;
};

function idempotencyKey(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function CampaignDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const [questTitle, setQuestTitle] = useState("");
  const [habitTitle, setHabitTitle] = useState("");
  const [bossTitle, setBossTitle] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [selectedBossId, setSelectedBossId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => api<Detail>(`/api/campaigns/${id}`),
    enabled: Boolean(id),
  });

  const sheetQuery = useQuery({
    queryKey: ["sheet"],
    queryFn: () => api<SheetResponse>("/api/characters/active/sheet"),
  });

  const skills = useMemo(() => {
    const attrs = sheetQuery.data?.sheet?.attributes ?? [];
    return attrs.flatMap((a) => a.skills);
  }, [sheetQuery.data]);

  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["campaign", id] }),
      qc.invalidateQueries({ queryKey: ["sheet"] }),
      qc.invalidateQueries({ queryKey: ["stats"] }),
      qc.invalidateQueries({ queryKey: ["inventory"] }),
    ]);
  };

  const createQuest = useMutation({
    mutationFn: () =>
      api(`/api/campaigns/${id}/quests`, {
        method: "POST",
        body: JSON.stringify({
          title: questTitle,
          questType: "main",
          difficulty: 3,
          bossId: selectedBossId || undefined,
          skillLinks: selectedSkillId
            ? [{ skillId: selectedSkillId, weight: 100 }]
            : [],
        }),
      }),
    onSuccess: async () => {
      setQuestTitle("");
      await invalidate();
    },
  });

  const createHabit = useMutation({
    mutationFn: () =>
      api(`/api/campaigns/${id}/habits`, {
        method: "POST",
        body: JSON.stringify({
          title: habitTitle,
          difficulty: 2,
          bossId: selectedBossId || undefined,
          skillLinks: selectedSkillId
            ? [{ skillId: selectedSkillId, weight: 100 }]
            : [],
        }),
      }),
    onSuccess: async () => {
      setHabitTitle("");
      await invalidate();
    },
  });

  const createBoss = useMutation({
    mutationFn: () =>
      api(`/api/campaigns/${id}/bosses`, {
        method: "POST",
        body: JSON.stringify({
          title: bossTitle,
          kind: "intermediate",
          maxHp: 100,
          phases: [
            {
              name: "Midpoint",
              hpThreshold: 50,
              rewardsJson: { gold: 25, item: { name: "Badge of Resolve", rarity: "uncommon" } },
            },
            { name: "Defeat", hpThreshold: 0, rewardsJson: { gold: 40 } },
          ],
        }),
      }),
    onSuccess: async () => {
      setBossTitle("");
      await invalidate();
    },
  });

  const complete = useMutation({
    mutationFn: (payload: { sourceType: "habit" | "quest"; sourceId: string }) =>
      api<{
        award?: { characterXp: number };
        duplicate?: boolean;
      }>("/api/completions", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          idempotencyKey: idempotencyKey(payload.sourceType),
        }),
      }),
    onSuccess: async (result) => {
      if (result.duplicate) {
        setMessage("Already processed (idempotent).");
      } else {
        setMessage(`Awarded ${result.award?.characterXp ?? 0} character XP.`);
      }
      await invalidate();
    },
    onError: (err: Error) => setMessage(err.message),
  });

  if (detailQuery.isLoading) return <p className="text-steel">Loading campaign…</p>;
  if (!detailQuery.data) {
    return (
      <div className="panel rounded-xl p-6">
        <p>Campaign not found.</p>
        <Link className="btn btn-secondary mt-4 inline-flex" to="/app/campaigns">
          Back
        </Link>
      </div>
    );
  }

  const { campaign, quests, habits, bosses } = detailQuery.data;

  function onQuestSubmit(e: FormEvent) {
    e.preventDefault();
    createQuest.mutate();
  }
  function onHabitSubmit(e: FormEvent) {
    e.preventDefault();
    createHabit.mutate();
  }
  function onBossSubmit(e: FormEvent) {
    e.preventDefault();
    createBoss.mutate();
  }

  return (
    <div className="space-y-6">
      <section className="panel rounded-xl p-6">
        <Link className="text-sm font-semibold text-forest" to="/app/campaigns">
          ← Campaigns
        </Link>
        <h1 className="mt-2 font-display text-4xl text-forest">{campaign.title}</h1>
        <p className="mt-2 text-steel">{campaign.mainObjective}</p>
        {campaign.narrative ? (
          <p className="mt-3 max-w-3xl leading-relaxed">{campaign.narrative}</p>
        ) : null}
        {message ? <p className="mt-4 text-sm text-ember">{message}</p> : null}
      </section>

      <section className="panel grid gap-4 rounded-xl p-5 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="skill">
            Skill link for new quests/habits
          </label>
          <select
            id="skill"
            className="input"
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
          >
            <option value="">None</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="boss">
            Boss link for new quests/habits
          </label>
          <select
            id="boss"
            className="input"
            value={selectedBossId}
            onChange={(e) => setSelectedBossId(e.target.value)}
          >
            <option value="">None</option>
            {bosses
              .filter((b) => b.status === "active")
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
          </select>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel rounded-xl p-5">
          <h2 className="font-display text-2xl text-forest">Quest board</h2>
          <form className="mt-4 flex gap-2" onSubmit={onQuestSubmit}>
            <input
              className="input"
              placeholder="New quest title"
              required
              value={questTitle}
              onChange={(e) => setQuestTitle(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Add
            </button>
          </form>
          <ul className="mt-4 space-y-3">
            {quests.map((q) => (
              <li key={q.id} className="rounded-md bg-white/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{q.title}</p>
                    <p className="text-xs text-mist">
                      {q.questType} · D{q.difficulty} · {q.status}
                    </p>
                  </div>
                  {q.status !== "completed" ? (
                    <button
                      className="btn btn-ember"
                      type="button"
                      disabled={complete.isPending}
                      onClick={() =>
                        complete.mutate({ sourceType: "quest", sourceId: q.id })
                      }
                    >
                      Complete
                    </button>
                  ) : (
                    <span className="text-sm text-forest">Done</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel rounded-xl p-5">
          <h2 className="font-display text-2xl text-forest">Daily missions</h2>
          <form className="mt-4 flex gap-2" onSubmit={onHabitSubmit}>
            <input
              className="input"
              placeholder="New habit title"
              required
              value={habitTitle}
              onChange={(e) => setHabitTitle(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Add
            </button>
          </form>
          <ul className="mt-4 space-y-3">
            {habits.map((h) => (
              <li key={h.id} className="rounded-md bg-white/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{h.title}</p>
                    <p className="text-xs text-mist">
                      Soft streak {h.softStreak} · D{h.difficulty}
                    </p>
                  </div>
                  <button
                    className="btn btn-ember"
                    type="button"
                    disabled={complete.isPending}
                    onClick={() =>
                      complete.mutate({ sourceType: "habit", sourceId: h.id })
                    }
                  >
                    Log today
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel rounded-xl p-5">
        <h2 className="font-display text-2xl text-forest">Bosses</h2>
        <form className="mt-4 flex gap-2" onSubmit={onBossSubmit}>
          <input
            className="input"
            placeholder="Boss title (e.g. Midterm Milestone)"
            required
            value={bossTitle}
            onChange={(e) => setBossTitle(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Summon
          </button>
        </form>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {bosses.map((boss) => (
            <article key={boss.id} className="rounded-md bg-white/40 p-4">
              <div className="flex justify-between gap-2">
                <h3 className="font-display text-xl">{boss.title}</h3>
                <span className="text-sm text-mist">{boss.kind}</span>
              </div>
              <p className="mt-1 text-sm text-steel">{boss.status}</p>
              <div className="mt-3">
                <ProgressBar
                  ratio={(boss.maxHp - boss.currentHp) / boss.maxHp}
                  label={`HP ${boss.currentHp}/${boss.maxHp}`}
                />
              </div>
              <p className="mt-2 text-xs text-mist">
                Select this boss above, then create quests or habits to deal
                damage on completion.
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
