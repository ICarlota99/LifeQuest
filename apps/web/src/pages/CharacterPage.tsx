import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProgressBar } from "../components/ProgressBar";
import { api } from "../lib/api";

const MAX_ATTRIBUTES = 6;
const MAX_SKILLS_PER_ATTRIBUTE = 6;

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
  minValue: number;
  maxValue: number;
  skills: Skill[];
};

type SheetCharacter = {
  id: string;
  name: string;
  className: string;
  race: string;
  background: string;
  biography: string;
  level: number;
  levelProgress: { progressRatio: number; xpIntoLevel: number; xpToNext: number };
};

type SheetResponse = {
  sheet: {
    character: SheetCharacter;
    attributes: Attribute[];
  } | null;
};

function slugifyKey(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 32) || "stat"
  );
}

export function CharacterPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    name: "",
    className: "",
    race: "",
    background: "",
    biography: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["sheet"],
    queryFn: () => api<SheetResponse>("/api/characters/active/sheet"),
  });

  useEffect(() => {
    const character = data?.sheet?.character;
    if (!character) return;
    setProfile({
      name: character.name,
      className: character.className,
      race: character.race,
      background: character.background,
      biography: character.biography,
    });
  }, [data?.sheet?.character]);

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["sheet"] });
    await qc.invalidateQueries({ queryKey: ["stats"] });
  };

  const saveProfile = useMutation({
    mutationFn: (characterId: string) =>
      api(`/api/characters/${characterId}`, {
        method: "PATCH",
        body: JSON.stringify(profile),
      }),
    onSuccess: async () => {
      setMessage("Character profile saved.");
      setError(null);
      await invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateAttribute = useMutation({
    mutationFn: (input: {
      id: string;
      name: string;
      key: string;
      description: string;
      score: number;
    }) =>
      api(`/api/characters/attributes/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: input.name,
          key: input.key,
          description: input.description,
          score: input.score,
        }),
      }),
    onSuccess: async () => {
      setMessage("Stat updated.");
      setError(null);
      await invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const createAttribute = useMutation({
    mutationFn: (characterId: string) => {
      const name = "New Stat";
      return api("/api/characters/attributes", {
        method: "POST",
        body: JSON.stringify({
          characterId,
          name,
          key: slugifyKey(`${name}_${Date.now()}`),
          description: "",
          score: 10,
        }),
      });
    },
    onSuccess: async () => {
      setMessage("Stat added.");
      setError(null);
      await invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteAttribute = useMutation({
    mutationFn: (id: string) =>
      api(`/api/characters/attributes/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setMessage("Stat removed.");
      setError(null);
      await invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateSkill = useMutation({
    mutationFn: (input: { id: string; name: string; description: string }) =>
      api(`/api/characters/skills/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: input.name,
          description: input.description,
        }),
      }),
    onSuccess: async () => {
      setMessage("Skill updated.");
      setError(null);
      await invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const createSkill = useMutation({
    mutationFn: (attributeId: string) =>
      api("/api/characters/skills", {
        method: "POST",
        body: JSON.stringify({
          attributeId,
          name: "New Skill",
          description: "",
        }),
      }),
    onSuccess: async () => {
      setMessage("Skill added.");
      setError(null);
      await invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteSkill = useMutation({
    mutationFn: (id: string) =>
      api(`/api/characters/skills/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setMessage("Skill removed.");
      setError(null);
      await invalidate();
    },
    onError: (err: Error) => setError(err.message),
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
  const canAddAttribute = attributes.length < MAX_ATTRIBUTES;
  const busy =
    saveProfile.isPending ||
    updateAttribute.isPending ||
    createAttribute.isPending ||
    deleteAttribute.isPending ||
    updateSkill.isPending ||
    createSkill.isPending ||
    deleteSkill.isPending;

  function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    saveProfile.mutate(character.id);
  }

  return (
    <div className="space-y-6">
      <section className="panel rounded-xl p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-forest">{character.name}</h1>
            <p className="mt-1 text-steel">
              Level {character.level} · {character.race} {character.className}
            </p>
          </div>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => {
              setEditing((v) => !v);
              setError(null);
              setMessage(null);
            }}
          >
            {editing ? "Done editing" : "Edit sheet"}
          </button>
        </div>

        {character.background && !editing ? (
          <p className="mt-3 text-sm text-mist">Background: {character.background}</p>
        ) : null}
        {character.biography && !editing ? (
          <p className="mt-3 max-w-3xl leading-relaxed text-ink">{character.biography}</p>
        ) : null}

        <div className="mt-4 max-w-md">
          <ProgressBar
            ratio={character.levelProgress.progressRatio}
            label={`Level XP ${character.levelProgress.xpIntoLevel}/${character.levelProgress.xpToNext}`}
          />
        </div>

        {editing ? (
          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSaveProfile}>
            <div className="sm:col-span-2">
              <p className="text-sm text-steel">
                Up to {MAX_ATTRIBUTES} stats, and up to {MAX_SKILLS_PER_ATTRIBUTE}{" "}
                skills under each stat.
              </p>
            </div>
            <div>
              <label className="label" htmlFor="char-name">
                Name
              </label>
              <input
                id="char-name"
                className="input"
                required
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="label" htmlFor="char-class">
                Class
              </label>
              <input
                id="char-class"
                className="input"
                value={profile.className}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, className: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label" htmlFor="char-race">
                Race
              </label>
              <input
                id="char-race"
                className="input"
                value={profile.race}
                onChange={(e) => setProfile((p) => ({ ...p, race: e.target.value }))}
              />
            </div>
            <div>
              <label className="label" htmlFor="char-background">
                Background
              </label>
              <input
                id="char-background"
                className="input"
                value={profile.background}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, background: e.target.value }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="char-bio">
                Biography
              </label>
              <textarea
                id="char-bio"
                className="input min-h-28"
                value={profile.biography}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, biography: e.target.value }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <button className="btn btn-primary" disabled={busy} type="submit">
                {saveProfile.isPending ? "Saving…" : "Save profile"}
              </button>
            </div>
          </form>
        ) : null}

        {error ? <p className="mt-4 text-sm text-crimson">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-ember">{message}</p> : null}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mist">
          Stats {attributes.length}/{MAX_ATTRIBUTES}
        </p>
        {editing && canAddAttribute ? (
          <button
            className="btn btn-secondary"
            disabled={busy}
            type="button"
            onClick={() => {
              setMessage(null);
              createAttribute.mutate(character.id);
            }}
          >
            Add stat
          </button>
        ) : null}
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {attributes.map((attr) => (
          <AttributeCard
            key={attr.id}
            attribute={attr}
            editing={editing}
            busy={busy}
            onSave={(draft) => {
              setMessage(null);
              updateAttribute.mutate({ id: attr.id, ...draft });
            }}
            onDelete={() => {
              if (
                !window.confirm(
                  `Remove "${attr.name}" and all of its skills? This cannot be undone.`,
                )
              ) {
                return;
              }
              setMessage(null);
              deleteAttribute.mutate(attr.id);
            }}
            onAddSkill={() => {
              setMessage(null);
              createSkill.mutate(attr.id);
            }}
            onSaveSkill={(skillId, draft) => {
              setMessage(null);
              updateSkill.mutate({ id: skillId, ...draft });
            }}
            onDeleteSkill={(skillId, skillName) => {
              if (!window.confirm(`Remove skill "${skillName}"?`)) return;
              setMessage(null);
              deleteSkill.mutate(skillId);
            }}
          />
        ))}
      </section>
    </div>
  );
}

function AttributeCard({
  attribute,
  editing,
  busy,
  onSave,
  onDelete,
  onAddSkill,
  onSaveSkill,
  onDeleteSkill,
}: {
  attribute: Attribute;
  editing: boolean;
  busy: boolean;
  onSave: (draft: {
    name: string;
    key: string;
    description: string;
    score: number;
  }) => void;
  onDelete: () => void;
  onAddSkill: () => void;
  onSaveSkill: (
    skillId: string,
    draft: { name: string; description: string },
  ) => void;
  onDeleteSkill: (skillId: string, skillName: string) => void;
}) {
  const [draft, setDraft] = useState({
    name: attribute.name,
    key: attribute.key,
    description: attribute.description,
    score: attribute.score,
  });

  useEffect(() => {
    setDraft({
      name: attribute.name,
      key: attribute.key,
      description: attribute.description,
      score: attribute.score,
    });
  }, [attribute]);

  const canAddSkill = attribute.skills.length < MAX_SKILLS_PER_ATTRIBUTE;

  if (!editing) {
    return (
      <article className="panel rounded-xl p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl text-forest">{attribute.name}</h2>
          <span className="font-display text-xl text-ember">{attribute.score}</span>
        </div>
        <p className="mt-1 text-sm text-steel">{attribute.description}</p>
        <ul className="mt-4 space-y-3">
          {attribute.skills.map((skill) => (
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
    );
  }

  return (
    <article className="panel rounded-xl p-5">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...draft,
            key: slugifyKey(draft.key || draft.name),
            score: Number(draft.score),
          });
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl text-forest">Edit stat</h2>
          <button
            className="text-sm font-semibold text-crimson"
            disabled={busy}
            type="button"
            onClick={onDelete}
          >
            Remove
          </button>
        </div>
        <div>
          <label className="label" htmlFor={`attr-name-${attribute.id}`}>
            Name
          </label>
          <input
            id={`attr-name-${attribute.id}`}
            className="input"
            required
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <label className="label" htmlFor={`attr-key-${attribute.id}`}>
              Key
            </label>
            <input
              id={`attr-key-${attribute.id}`}
              className="input"
              required
              value={draft.key}
              onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor={`attr-score-${attribute.id}`}>
              Score
            </label>
            <input
              id={`attr-score-${attribute.id}`}
              className="input w-20"
              type="number"
              min={attribute.minValue}
              max={attribute.maxValue}
              required
              value={draft.score}
              onChange={(e) =>
                setDraft((d) => ({ ...d, score: Number(e.target.value) }))
              }
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor={`attr-desc-${attribute.id}`}>
            Description
          </label>
          <textarea
            id={`attr-desc-${attribute.id}`}
            className="input min-h-20"
            value={draft.description}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value }))
            }
          />
        </div>
        <button className="btn btn-primary" disabled={busy} type="submit">
          Save stat
        </button>
      </form>

      <div className="mt-5 border-t border-mist/30 pt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-mist">
            Skills {attribute.skills.length}/{MAX_SKILLS_PER_ATTRIBUTE}
          </p>
          {canAddSkill ? (
            <button
              className="btn btn-secondary"
              disabled={busy}
              type="button"
              onClick={onAddSkill}
            >
              Add skill
            </button>
          ) : null}
        </div>
        <ul className="space-y-3">
          {attribute.skills.map((skill) => (
            <SkillEditor
              key={skill.id}
              skill={skill}
              busy={busy}
              onSave={(draftSkill) => onSaveSkill(skill.id, draftSkill)}
              onDelete={() => onDeleteSkill(skill.id, skill.name)}
            />
          ))}
        </ul>
      </div>
    </article>
  );
}

function SkillEditor({
  skill,
  busy,
  onSave,
  onDelete,
}: {
  skill: Skill;
  busy: boolean;
  onSave: (draft: { name: string; description: string }) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState({
    name: skill.name,
    description: skill.description,
  });

  useEffect(() => {
    setDraft({ name: skill.name, description: skill.description });
  }, [skill]);

  return (
    <li className="rounded-md bg-white/40 px-3 py-3">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(draft);
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-mist">Rank {skill.rank}</span>
          <button
            className="text-xs font-semibold text-crimson"
            disabled={busy}
            type="button"
            onClick={onDelete}
          >
            Remove
          </button>
        </div>
        <input
          className="input"
          required
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          aria-label="Skill name"
        />
        <textarea
          className="input min-h-16"
          value={draft.description}
          onChange={(e) =>
            setDraft((d) => ({ ...d, description: e.target.value }))
          }
          aria-label="Skill description"
        />
        <button className="btn btn-secondary" disabled={busy} type="submit">
          Save skill
        </button>
      </form>
    </li>
  );
}
