import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { authClient } from "../lib/auth-client";

type SettingsResponse = {
  settings: { preset: string; version: number };
  config: {
    mChar: number;
    mSkill: number;
    dailyCharacterXpCap: number;
    milestoneGateFromRank: number | null;
  };
};

export function SettingsPage() {
  const qc = useQueryClient();
  const { data: session } = authClient.useSession();
  const [preset, setPreset] = useState<"casual" | "balanced" | "hardcore">(
    "balanced",
  );
  const [timezone, setTimezone] = useState("UTC");
  const [message, setMessage] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["progression-settings"],
    queryFn: () => api<SettingsResponse>("/api/progression-settings"),
  });

  useEffect(() => {
    if (data?.settings.preset) {
      setPreset(data.settings.preset as typeof preset);
    }
  }, [data]);

  useEffect(() => {
    const tz =
      (session?.user as { timezone?: string } | undefined)?.timezone ??
      Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);
  }, [session]);

  const savePreset = useMutation({
    mutationFn: () =>
      api("/api/progression-settings", {
        method: "PUT",
        body: JSON.stringify({ preset }),
      }),
    onSuccess: async () => {
      setMessage("Progression preset updated (new rule version).");
      await qc.invalidateQueries({ queryKey: ["progression-settings"] });
    },
  });

  const saveProfile = useMutation({
    mutationFn: () =>
      api("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ timezone }),
      }),
    onSuccess: () => setMessage("Profile updated."),
  });

  function onPresetSubmit(e: FormEvent) {
    e.preventDefault();
    savePreset.mutate();
  }

  function onProfileSubmit(e: FormEvent) {
    e.preventDefault();
    saveProfile.mutate();
  }

  return (
    <div className="space-y-6">
      <section className="panel rounded-xl p-6">
        <h1 className="font-display text-3xl text-forest">Settings</h1>
        {message ? <p className="mt-2 text-sm text-ember">{message}</p> : null}
      </section>

      <section className="panel rounded-xl p-6">
        <h2 className="font-display text-2xl text-forest">Progression preset</h2>
        <p className="mt-2 text-sm text-steel">
          Changing presets creates a new rule-set version. Past XP awards keep
          their original rule snapshot.
        </p>
        {data ? (
          <p className="mt-2 text-xs text-mist">
            Active version {data.settings.version} · Mchar {data.config.mChar} ·
            daily cap {data.config.dailyCharacterXpCap} · gates from rank{" "}
            {data.config.milestoneGateFromRank ?? "off"}
          </p>
        ) : null}
        <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={onPresetSubmit}>
          <div>
            <label className="label" htmlFor="preset">
              Preset
            </label>
            <select
              id="preset"
              className="input"
              value={preset}
              onChange={(e) => setPreset(e.target.value as typeof preset)}
            >
              <option value="casual">Casual</option>
              <option value="balanced">Balanced</option>
              <option value="hardcore">Hardcore</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit">
            Save preset
          </button>
        </form>
      </section>

      <section className="panel rounded-xl p-6">
        <h2 className="font-display text-2xl text-forest">Profile</h2>
        <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={onProfileSubmit}>
          <div>
            <label className="label" htmlFor="timezone">
              Timezone
            </label>
            <input
              id="timezone"
              className="input"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" type="submit">
            Save profile
          </button>
        </form>
      </section>
    </div>
  );
}
