import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { ManageSkillsModal } from "../components/ManageSkillsModal";
import { ProgressBar } from "../components/ProgressBar";
import { api } from "../lib/api";
import { attributeVisual } from "../lib/attributes";

const MAX_ATTRIBUTES = 6;

type RankProgress = {
  rank: number;
  xpIntoRank: number;
  xpToNext: number;
  progressRatio: number;
};

type Skill = {
  id: string;
  name: string;
  description: string;
  rank: number;
  skillXp: number;
  sortOrder: number;
  rankProgress?: RankProgress;
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
  levelProgress: {
    progressRatio: number;
    xpIntoLevel: number;
    xpToNext: number;
  };
};

type SheetResponse = {
  sheet: {
    character: SheetCharacter;
    attributes: Attribute[];
  } | null;
};

type AttrDraft = {
  name: string;
  description: string;
  score: number;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingAttrs, setEditingAttrs] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, AttrDraft>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["sheet"],
    queryFn: () => api<SheetResponse>("/api/characters/active/sheet"),
  });

  const attributes = data?.sheet?.attributes ?? [];
  const character = data?.sheet?.character;

  useEffect(() => {
    if (!attributes.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !attributes.some((a) => a.id === selectedId)) {
      setSelectedId(attributes[0]!.id);
    }
  }, [attributes, selectedId]);

  useEffect(() => {
    const next: Record<string, AttrDraft> = {};
    for (const attr of attributes) {
      next[attr.id] = {
        name: attr.name,
        description: attr.description,
        score: attr.score,
      };
    }
    setDrafts(next);
  }, [attributes]);

  const selected = useMemo(
    () => attributes.find((a) => a.id === selectedId) ?? null,
    [attributes, selectedId],
  );

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["sheet"] });
    await qc.invalidateQueries({ queryKey: ["stats"] });
  };

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

  const bumpScore = useMutation({
    mutationFn: (input: { id: string; score: number }) =>
      api(`/api/characters/attributes/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({ score: input.score }),
      }),
    onSuccess: async () => {
      setError(null);
      await invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  if (isLoading) {
    return <p className="text-steel">Unrolling character sheet…</p>;
  }

  if (!character || !data?.sheet) {
    return (
      <div className="grimoire-card p-8">
        <h1 className="font-display text-3xl text-forest">No character</h1>
        <p className="mt-2 text-steel">
          Create your adventurer to open the grimoire.
        </p>
        <Link className="btn btn-primary mt-4 inline-flex" to="/app/character/new">
          Create one
        </Link>
      </div>
    );
  }

  const busy =
    createAttribute.isPending ||
    deleteAttribute.isPending ||
    bumpScore.isPending;

  async function saveAllAttributes(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await Promise.all(
        attributes.map((attr) => {
          const draft = drafts[attr.id];
          if (!draft) return Promise.resolve();
          return api(`/api/characters/attributes/${attr.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              name: draft.name,
              key: slugifyKey(attr.key || draft.name),
              description: draft.description,
              score: draft.score,
            }),
          });
        }),
      );
      setMessage("Attributes saved.");
      setEditingAttrs(false);
      await invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save attributes");
    }
  }

  function openManageSkills() {
    if (!selected && attributes[0]) {
      setSelectedId(attributes[0].id);
    }
    setManageOpen(true);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-mist uppercase">
            LifeQuest
          </p>
          <h1 className="font-display text-3xl text-forest md:text-4xl">
            Character Sheet
          </h1>
          <p className="mt-1 text-steel">
            {character.name} · {character.race} {character.className}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={clsx("btn", editingAttrs ? "btn-ember" : "btn-secondary")}
            type="button"
            onClick={() => {
              setEditingAttrs((v) => !v);
              setMessage(null);
              setError(null);
            }}
          >
            {editingAttrs ? "Cancel edit" : "Edit Attributes"}
          </button>
          <button
            className="btn btn-gold"
            type="button"
            onClick={openManageSkills}
          >
            Manage Skills
          </button>
        </div>
      </header>

      {error ? <p className="text-sm text-crimson">{error}</p> : null}
      {message ? <p className="text-sm text-ember">{message}</p> : null}

      <section className="grimoire-card p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-forest">
              Level {character.level} {character.className}
            </h2>
            <p className="text-sm text-mist">
              {character.levelProgress.xpIntoLevel} /{" "}
              {character.levelProgress.xpToNext} XP to next level
            </p>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar
            ratio={character.levelProgress.progressRatio}
            variant="arcane"
          />
        </div>
      </section>

      {editingAttrs ? (
        <form className="grimoire-card space-y-4 p-5 md:p-6" onSubmit={saveAllAttributes}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-forest">Edit Attributes</h2>
              <p className="text-sm text-steel">
                Rename, adjust scores, and rewrite descriptions. Max {MAX_ATTRIBUTES}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {attributes.length < MAX_ATTRIBUTES ? (
                <button
                  className="btn btn-secondary"
                  disabled={busy}
                  type="button"
                  onClick={() => createAttribute.mutate(character.id)}
                >
                  Add attribute
                </button>
              ) : null}
              <button className="btn btn-primary" disabled={busy} type="submit">
                Save changes
              </button>
            </div>
          </div>

          <ul className="space-y-4">
            {attributes.map((attr) => {
              const draft = drafts[attr.id] ?? {
                name: attr.name,
                description: attr.description,
                score: attr.score,
              };
              const visual = attributeVisual(attr.key);
              return (
                <li
                  key={attr.id}
                  className="rounded-xl border border-mist/35 bg-white/35 p-4"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <span className={clsx("hex-icon", visual.hexClass)}>
                      {visual.label}
                    </span>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <div>
                          <label className="label" htmlFor={`edit-name-${attr.id}`}>
                            Name
                          </label>
                          <input
                            id={`edit-name-${attr.id}`}
                            className="input"
                            required
                            value={draft.name}
                            onChange={(e) =>
                              setDrafts((d) => ({
                                ...d,
                                [attr.id]: { ...draft, name: e.target.value },
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="label" htmlFor={`edit-score-${attr.id}`}>
                            Score
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              className="btn-icon"
                              type="button"
                              aria-label="Decrease score"
                              disabled={draft.score <= attr.minValue}
                              onClick={() =>
                                setDrafts((d) => ({
                                  ...d,
                                  [attr.id]: {
                                    ...draft,
                                    score: Math.max(attr.minValue, draft.score - 1),
                                  },
                                }))
                              }
                            >
                              −
                            </button>
                            <input
                              id={`edit-score-${attr.id}`}
                              className="input w-16 text-center"
                              type="number"
                              min={attr.minValue}
                              max={attr.maxValue}
                              value={draft.score}
                              onChange={(e) =>
                                setDrafts((d) => ({
                                  ...d,
                                  [attr.id]: {
                                    ...draft,
                                    score: Number(e.target.value),
                                  },
                                }))
                              }
                            />
                            <button
                              className="btn-icon"
                              type="button"
                              aria-label="Increase score"
                              disabled={draft.score >= attr.maxValue}
                              onClick={() =>
                                setDrafts((d) => ({
                                  ...d,
                                  [attr.id]: {
                                    ...draft,
                                    score: Math.min(attr.maxValue, draft.score + 1),
                                  },
                                }))
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="label" htmlFor={`edit-desc-${attr.id}`}>
                          Description
                        </label>
                        <textarea
                          id={`edit-desc-${attr.id}`}
                          className="input min-h-20"
                          value={draft.description}
                          onChange={(e) =>
                            setDrafts((d) => ({
                              ...d,
                              [attr.id]: {
                                ...draft,
                                description: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      {attributes.length > 1 ? (
                        <button
                          className="text-sm font-semibold text-crimson"
                          disabled={busy}
                          type="button"
                          onClick={() => {
                            if (
                              !window.confirm(
                                `Remove "${attr.name}" and all of its skills?`,
                              )
                            ) {
                              return;
                            }
                            deleteAttribute.mutate(attr.id);
                          }}
                        >
                          Remove attribute
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </form>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <section className="grimoire-card p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-display text-xl text-forest">Attributes</h2>
              <span className="text-xs text-mist">
                {attributes.length}/{MAX_ATTRIBUTES}
              </span>
            </div>
            <ul className="space-y-2.5">
              {attributes.map((attr) => {
                const visual = attributeVisual(attr.key);
                const isSelected = attr.id === selectedId;
                return (
                  <li key={attr.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      className={clsx(
                        "attr-row cursor-pointer",
                        isSelected && "attr-row-selected",
                      )}
                      onClick={() => setSelectedId(attr.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedId(attr.id);
                        }
                      }}
                    >
                      <span className={clsx("hex-icon", visual.hexClass)}>
                        {visual.label}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-lg text-forest">
                          {attr.name}
                        </span>
                        <span className="line-clamp-1 text-sm text-steel">
                          {attr.description || "No description yet"}
                        </span>
                      </span>
                      <span
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <button
                          className="btn-icon"
                          type="button"
                          aria-label={`Decrease ${attr.name}`}
                          disabled={busy || attr.score <= attr.minValue}
                          onClick={() =>
                            bumpScore.mutate({
                              id: attr.id,
                              score: attr.score - 1,
                            })
                          }
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center font-display text-xl text-ember">
                          {attr.score}
                        </span>
                        <button
                          className="btn-icon"
                          type="button"
                          aria-label={`Increase ${attr.name}`}
                          disabled={busy || attr.score >= attr.maxValue}
                          onClick={() =>
                            bumpScore.mutate({
                              id: attr.id,
                              score: attr.score + 1,
                            })
                          }
                        >
                          +
                        </button>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="grimoire-card p-4 md:p-5">
            {selected ? (
              <>
                <div className="flex items-start gap-3">
                  <span
                    className={clsx(
                      "hex-icon hex-icon-lg",
                      attributeVisual(selected.key).hexClass,
                    )}
                  >
                    {attributeVisual(selected.key).label}
                  </span>
                  <div>
                    <h2 className="font-display text-2xl text-forest">
                      {selected.name}
                    </h2>
                    <p className="text-sm text-mist">
                      Score {selected.score} · {selected.skills.length} skills
                    </p>
                  </div>
                </div>
                <p className="mt-4 leading-relaxed text-ink">
                  {selected.description ||
                    "Add a description in Edit Attributes to explain this trait."}
                </p>

                <div className="mt-5 border-t border-mist/30 pt-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="font-display text-lg text-forest">
                      Associated Skills
                    </h3>
                    <button
                      className="btn-icon"
                      type="button"
                      aria-label="Manage skills"
                      title="Manage skills"
                      onClick={() => setManageOpen(true)}
                    >
                      ⚙
                    </button>
                  </div>
                  {selected.skills.length === 0 ? (
                    <p className="text-sm text-steel">
                      No skills yet. Open Manage Skills to add some.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {selected.skills.map((skill) => (
                        <li
                          key={skill.id}
                          className="rounded-lg bg-white/40 px-3 py-2.5"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-semibold">{skill.name}</span>
                            <span className="text-xs text-mist">
                              Rank {skill.rank}
                            </span>
                          </div>
                          {skill.description ? (
                            <p className="mt-0.5 text-xs text-steel">
                              {skill.description}
                            </p>
                          ) : null}
                          <div className="mt-2">
                            <ProgressBar
                              ratio={skill.rankProgress?.progressRatio ?? 0}
                              label={
                                skill.rankProgress
                                  ? `${skill.rankProgress.xpIntoRank}/${skill.rankProgress.xpToNext} XP`
                                  : `${skill.skillXp} XP`
                              }
                              variant="arcane"
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <p className="text-steel">Select an attribute to see its details.</p>
            )}
          </section>
        </div>
      )}

      {!editingAttrs ? (
        <section className="grimoire-card p-4 md:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl text-forest">
              Skills Overview
              {selected ? (
                <span className="ml-2 text-base font-sans font-normal text-mist">
                  · {selected.name}
                </span>
              ) : null}
            </h2>
            <button className="btn btn-secondary" type="button" onClick={openManageSkills}>
              Manage Skills
            </button>
          </div>
          {selected && selected.skills.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {selected.skills.map((skill) => (
                <div key={skill.id} className="skill-chip">
                  <span
                    className={clsx(
                      "hex-icon !h-9 !w-9 !text-[0.65rem]",
                      attributeVisual(selected.key).hexClass,
                    )}
                  >
                    {skill.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="max-w-20 truncate text-xs font-semibold">
                    {skill.name}
                  </span>
                  <span className="text-[10px] text-mist">Lv {skill.rank}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-steel">
              Select an attribute to preview its skills at a glance.
            </p>
          )}
        </section>
      ) : null}

      <p className="rounded-lg border border-gold/30 bg-white/30 px-4 py-2 text-sm text-steel">
        Tip: adjust scores from the attribute list, refine names in Edit Attributes,
        and keep skill setup in Manage Skills so the sheet stays readable.
      </p>

      {selected ? (
        <ManageSkillsModal
          open={manageOpen}
          attributeId={selected.id}
          attributeName={selected.name}
          skills={selected.skills}
          onClose={() => setManageOpen(false)}
          onError={(msg) => setError(msg)}
        />
      ) : null}
    </div>
  );
}
