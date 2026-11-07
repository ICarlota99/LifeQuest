import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function CreateCharacterPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [className, setClassName] = useState("Adventurer");
  const [race, setRace] = useState("Human");
  const [background, setBackground] = useState("");
  const [biography, setBiography] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api("/api/characters", {
        method: "POST",
        body: JSON.stringify({ name, className, race, background, biography }),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["sheet"] });
      navigate("/app/character");
    },
    onError: (err: Error) => setError(err.message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <div className="panel mx-auto max-w-xl rounded-xl p-8">
      <h1 className="font-display text-3xl text-forest">Create your character</h1>
      <p className="mt-2 text-steel">
        You&apos;ll start with the classic six attributes and sample skills. You
        can rename and customize them later.
      </p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="className">
              Class
            </label>
            <input
              id="className"
              className="input"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="race">
              Race
            </label>
            <input
              id="race"
              className="input"
              value={race}
              onChange={(e) => setRace(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="background">
            Background
          </label>
          <input
            id="background"
            className="input"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="biography">
            Biography
          </label>
          <textarea
            id="biography"
            className="input min-h-28"
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-crimson">{error}</p> : null}
        <button
          className="btn btn-primary"
          disabled={mutation.isPending}
          type="submit"
        >
          {mutation.isPending ? "Forging…" : "Create character"}
        </button>
      </form>
    </div>
  );
}
