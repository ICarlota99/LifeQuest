import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
  isSystem: number;
};

export function AchievementsPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: () =>
      api<{ achievements: Achievement[] }>("/api/achievements"),
  });

  const create = useMutation({
    mutationFn: () =>
      api("/api/achievements", {
        method: "POST",
        body: JSON.stringify({ title, description }),
      }),
    onSuccess: async () => {
      setTitle("");
      setDescription("");
      await qc.invalidateQueries({ queryKey: ["achievements"] });
    },
  });

  const unlock = useMutation({
    mutationFn: (id: string) =>
      api(`/api/achievements/${id}/unlock`, { method: "POST" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["achievements"] });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <div className="space-y-6">
      <section className="panel rounded-xl p-6">
        <h1 className="font-display text-3xl text-forest">Achievements</h1>
        <form className="mt-6 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <input
            className="input"
            placeholder="Custom achievement title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="input"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button className="btn btn-primary md:col-span-2" type="submit">
            Define achievement
          </button>
        </form>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {isLoading ? <p className="text-steel">Consulting the codex…</p> : null}
        {(data?.achievements ?? []).map((ach) => (
          <article key={ach.id} className="panel rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl">{ach.title}</h2>
                <p className="mt-1 text-sm text-steel">{ach.description}</p>
                <p className="mt-2 text-xs text-mist">
                  {ach.isSystem ? "System" : "Custom"} ·{" "}
                  {ach.unlocked
                    ? `Unlocked ${ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString() : ""}`
                    : "Locked"}
                </p>
              </div>
              {!ach.unlocked ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => unlock.mutate(ach.id)}
                >
                  Unlock
                </button>
              ) : (
                <span className="text-forest">✓</span>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
