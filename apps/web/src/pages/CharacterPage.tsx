import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ProgressBar } from "../components/ProgressBar";
import { api } from "../lib/api";

type Skill = {
  id: string;
  name: string;
  description: string;
  rank: number;
  skillXp: number;
};

type Attribute = {
  id: string;
  name: string;
  key: string;
  description: string;
  score: number;
  skills: Skill[];
};

type SheetResponse = {
  sheet: {
    character: {
      name: string;
      className: string;
      race: string;
      background: string;
      biography: string;
      level: number;
      levelProgress: { progressRatio: number; xpIntoLevel: number; xpToNext: number };
    };
    attributes: Attribute[];
  } | null;
};

export function CharacterPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["sheet"],
    queryFn: () => api<SheetResponse>("/api/characters/active/sheet"),
  });

  if (isLoading) return <p className="text-steel">Unrolling character sheet…</p>;
  if (!data?.sheet) {
    return (
      <div className="panel rounded-xl p-8">
        <h1 className="font-display text-3xl">No character</h1>
        <Link className="btn btn-primary mt-4 inline-flex" to="/app/character/new">
          Create one
        </Link>
      </div>
    );
  }

  const { character, attributes } = data.sheet;

  return (
    <div className="space-y-6">
      <section className="panel rounded-xl p-6 md:p-8">
        <h1 className="font-display text-4xl text-forest">{character.name}</h1>
        <p className="mt-1 text-steel">
          Level {character.level} · {character.race} {character.className}
        </p>
        {character.background ? (
          <p className="mt-3 text-sm text-mist">Background: {character.background}</p>
        ) : null}
        {character.biography ? (
          <p className="mt-3 max-w-3xl leading-relaxed text-ink">{character.biography}</p>
        ) : null}
        <div className="mt-4 max-w-md">
          <ProgressBar
            ratio={character.levelProgress.progressRatio}
            label={`Level XP ${character.levelProgress.xpIntoLevel}/${character.levelProgress.xpToNext}`}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {attributes.map((attr) => (
          <article key={attr.id} className="panel rounded-xl p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl text-forest">{attr.name}</h2>
              <span className="font-display text-xl text-ember">{attr.score}</span>
            </div>
            <p className="mt-1 text-sm text-steel">{attr.description}</p>
            <ul className="mt-4 space-y-3">
              {attr.skills.map((skill) => (
                <li key={skill.id} className="rounded-md bg-white/40 px-3 py-2">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold">{skill.name}</span>
                    <span className="text-sm text-mist">Rank {skill.rank}</span>
                  </div>
                  <p className="text-xs text-steel">{skill.description}</p>
                  <p className="mt-1 text-xs text-mist">{skill.skillXp} skill XP</p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
