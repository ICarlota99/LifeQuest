import clsx from "clsx";

export function ProgressBar({
  ratio,
  label,
  variant = "default",
}: {
  ratio: number;
  label?: string;
  variant?: "default" | "arcane";
}) {
  const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  return (
    <div>
      {label ? (
        <div className="mb-1 flex justify-between text-xs text-steel">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      ) : null}
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={clsx(
            "progress-fill",
            variant === "arcane" && "progress-fill-arcane",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
