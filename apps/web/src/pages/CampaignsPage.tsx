import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

type Campaign = {
  id: string;
  title: string;
  mainObjective: string;
  status: string;
  difficulty: number;
};

export function CampaignsPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [mainObjective, setMainObjective] = useState("");
  const [difficulty, setDifficulty] = useState(3);

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => api<{ campaigns: Campaign[] }>("/api/campaigns"),
  });

  const create = useMutation({
    mutationFn: () =>
      api("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({ title, mainObjective, difficulty }),
      }),
    onSuccess: async () => {
      setTitle("");
      setMainObjective("");
      await qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <div className="space-y-6">
      <section className="panel rounded-xl p-6">
        <h1 className="font-display text-3xl text-forest">Campaigns</h1>
        <p className="mt-2 text-steel">
          Each campaign is a season of personal growth with quests, habits, and bosses.
        </p>
        <form className="mt-6 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="md:col-span-2">
            <label className="label" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              className="input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Architect of a New Life"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="objective">
              Main objective
            </label>
            <input
              id="objective"
              className="input"
              value={mainObjective}
              onChange={(e) => setMainObjective(e.target.value)}
              placeholder="Become a proficient full-stack developer in 3 months"
            />
          </div>
          <div>
            <label className="label" htmlFor="difficulty">
              Difficulty (1–5)
            </label>
            <input
              id="difficulty"
              className="input"
              type="number"
              min={1}
              max={5}
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
            />
          </div>
          <div className="flex items-end">
            <button className="btn btn-primary" disabled={create.isPending} type="submit">
              Start campaign
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        {isLoading ? <p className="text-steel">Loading campaigns…</p> : null}
        {(data?.campaigns ?? []).map((campaign) => (
          <Link
            key={campaign.id}
            to={`/app/campaigns/${campaign.id}`}
            className="panel block rounded-xl p-5 transition hover:-translate-y-0.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl text-forest">{campaign.title}</h2>
              <span className="text-sm text-mist">
                D{campaign.difficulty} · {campaign.status}
              </span>
            </div>
            <p className="mt-2 text-steel">{campaign.mainObjective || "No objective set"}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
