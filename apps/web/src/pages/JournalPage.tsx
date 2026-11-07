import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

type Entry = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  entryDate: string;
};

export function JournalPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["journal"],
    queryFn: () => api<{ entries: Entry[] }>("/api/journal"),
  });

  const create = useMutation({
    mutationFn: () =>
      api("/api/journal", {
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      }),
    onSuccess: async () => {
      setTitle("");
      setBody("");
      setTags("");
      await qc.invalidateQueries({ queryKey: ["journal"] });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <div className="space-y-6">
      <section className="panel rounded-xl p-6">
        <h1 className="font-display text-3xl text-forest">Adventure journal</h1>
        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <input
            className="input"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="input min-h-32"
            placeholder="What happened today?"
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <input
            className="input"
            placeholder="Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Record entry
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {isLoading ? <p className="text-steel">Reading the chronicle…</p> : null}
        {(data?.entries ?? []).map((entry) => (
          <article key={entry.id} className="panel rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl">
                {entry.title || "Untitled entry"}
              </h2>
              <time className="text-sm text-mist">
                {new Date(entry.entryDate).toLocaleString()}
              </time>
            </div>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed">{entry.body}</p>
            {entry.tags?.length ? (
              <p className="mt-3 text-xs text-ember">
                {entry.tags.map((t) => `#${t}`).join(" ")}
              </p>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}
