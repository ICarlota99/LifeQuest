import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

const MAX_SKILLS_PER_ATTRIBUTE = 6;

export type ManageSkill = {
  id: string;
  name: string;
  description: string;
  rank: number;
  skillXp: number;
  sortOrder?: number;
};

type Props = {
  open: boolean;
  attributeId: string;
  attributeName: string;
  skills: ManageSkill[];
  onClose: () => void;
  onError: (message: string) => void;
};

export function ManageSkillsModal({
  open,
  attributeId,
  attributeName,
  skills,
  onClose,
  onError,
}: Props) {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<
    Record<string, { name: string; description: string }>
  >({});

  useEffect(() => {
    if (!open) return;
    const next: Record<string, { name: string; description: string }> = {};
    for (const skill of skills) {
      next[skill.id] = { name: skill.name, description: skill.description };
    }
    setDrafts(next);
  }, [open, skills]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["sheet"] });

  const createSkill = useMutation({
    mutationFn: () =>
      api("/api/characters/skills", {
        method: "POST",
        body: JSON.stringify({
          attributeId,
          name: "New Skill",
          description: "",
        }),
      }),
    onSuccess: async () => {
      await invalidate();
    },
    onError: (err: Error) => onError(err.message),
  });

  const updateSkill = useMutation({
    mutationFn: (input: {
      id: string;
      name?: string;
      description?: string;
      sortOrder?: number;
    }) =>
      api(`/api/characters/skills/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: input.name,
          description: input.description,
          sortOrder: input.sortOrder,
        }),
      }),
    onSuccess: async () => {
      await invalidate();
    },
    onError: (err: Error) => onError(err.message),
  });

  const deleteSkill = useMutation({
    mutationFn: (id: string) =>
      api(`/api/characters/skills/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await invalidate();
    },
    onError: (err: Error) => onError(err.message),
  });

  if (!open) return null;

  const ordered = [...skills].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const canAdd = ordered.length < MAX_SKILLS_PER_ATTRIBUTE;
  const busy =
    createSkill.isPending || updateSkill.isPending || deleteSkill.isPending;

  async function moveSkill(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const a = ordered[index]!;
    const b = ordered[target]!;
    const aOrder = a.sortOrder ?? index;
    const bOrder = b.sortOrder ?? target;
    try {
      await Promise.all([
        api(`/api/characters/skills/${a.id}`, {
          method: "PATCH",
          body: JSON.stringify({ sortOrder: bOrder }),
        }),
        api(`/api/characters/skills/${b.id}`, {
          method: "PATCH",
          body: JSON.stringify({ sortOrder: aOrder }),
        }),
      ]);
      await invalidate();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not reorder skills");
    }
  }

  function onSaveSkill(e: FormEvent, skillId: string) {
    e.preventDefault();
    const draft = drafts[skillId];
    if (!draft) return;
    updateSkill.mutate({
      id: skillId,
      name: draft.name,
      description: draft.description,
    });
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-skills-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="manage-skills-title"
              className="font-display text-2xl text-forest"
            >
              Manage Skills
            </h2>
            <p className="mt-1 text-sm text-steel">
              {attributeName} · {ordered.length}/{MAX_SKILLS_PER_ATTRIBUTE}
            </p>
          </div>
          <button className="btn btn-secondary px-3 py-2" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <ul className="mt-5 space-y-3">
          {ordered.map((skill, index) => (
            <li
              key={skill.id}
              className="rounded-xl border border-mist/35 bg-white/40 p-3"
            >
              <form
                className="space-y-2"
                onSubmit={(e) => onSaveSkill(e, skill.id)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-mist">Rank {skill.rank}</span>
                  <div className="flex items-center gap-1">
                    <button
                      className="btn-icon"
                      disabled={busy || index === 0}
                      type="button"
                      aria-label="Move up"
                      onClick={() => moveSkill(index, -1)}
                    >
                      ↑
                    </button>
                    <button
                      className="btn-icon"
                      disabled={busy || index === ordered.length - 1}
                      type="button"
                      aria-label="Move down"
                      onClick={() => moveSkill(index, 1)}
                    >
                      ↓
                    </button>
                    <button
                      className="text-xs font-semibold text-crimson"
                      disabled={busy}
                      type="button"
                      onClick={() => {
                        if (!window.confirm(`Remove "${skill.name}"?`)) return;
                        deleteSkill.mutate(skill.id);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <input
                  className="input"
                  required
                  value={drafts[skill.id]?.name ?? skill.name}
                  onChange={(e) =>
                    setDrafts((d) => ({
                      ...d,
                      [skill.id]: {
                        name: e.target.value,
                        description: d[skill.id]?.description ?? skill.description,
                      },
                    }))
                  }
                  aria-label="Skill name"
                />
                <textarea
                  className="input min-h-16"
                  value={drafts[skill.id]?.description ?? skill.description}
                  onChange={(e) =>
                    setDrafts((d) => ({
                      ...d,
                      [skill.id]: {
                        name: d[skill.id]?.name ?? skill.name,
                        description: e.target.value,
                      },
                    }))
                  }
                  aria-label="Skill description"
                />
                <button className="btn btn-secondary" disabled={busy} type="submit">
                  Save skill
                </button>
              </form>
            </li>
          ))}
        </ul>

        {ordered.length === 0 ? (
          <p className="mt-4 text-sm text-steel">
            No skills yet. Add one to start tracking progress under this attribute.
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {canAdd ? (
            <button
              className="btn btn-primary"
              disabled={busy}
              type="button"
              onClick={() => createSkill.mutate()}
            >
              {createSkill.isPending ? "Adding…" : "Add skill"}
            </button>
          ) : (
            <p className="text-sm text-mist">
              Maximum of {MAX_SKILLS_PER_ATTRIBUTE} skills reached.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
