export const ATTRIBUTE_COLOR_IDS = [
  "ember",
  "jade",
  "moss",
  "azure",
  "amethyst",
  "gold",
  "crimson",
  "steel",
  "bronze",
  "midnight",
] as const;

export type AttributeColorId = (typeof ATTRIBUTE_COLOR_IDS)[number];

export const DEFAULT_ATTRIBUTE_COLOR: AttributeColorId = "steel";

/** Fantasy-toned palette for attribute hex icons. */
export const ATTRIBUTE_COLOR_PALETTE: Record<
  AttributeColorId,
  { id: AttributeColorId; label: string; from: string; to: string }
> = {
  ember: { id: "ember", label: "Ember", from: "#c2410c", to: "#9a3412" },
  jade: { id: "jade", label: "Jade", from: "#0d9488", to: "#0f766e" },
  moss: { id: "moss", label: "Moss", from: "#3f6b3a", to: "#2d4f29" },
  azure: { id: "azure", label: "Azure", from: "#2563eb", to: "#1d4ed8" },
  amethyst: { id: "amethyst", label: "Amethyst", from: "#7c3aed", to: "#5b21b6" },
  gold: { id: "gold", label: "Gold", from: "#ca8a04", to: "#a16207" },
  crimson: { id: "crimson", label: "Crimson", from: "#9f1239", to: "#7f1d1d" },
  steel: { id: "steel", label: "Steel", from: "#64748b", to: "#475569" },
  bronze: { id: "bronze", label: "Bronze", from: "#b45309", to: "#92400e" },
  midnight: { id: "midnight", label: "Midnight", from: "#312e81", to: "#1e1b4b" },
};

const PRESET_KEY_COLORS: Record<string, AttributeColorId> = {
  str: "ember",
  dex: "jade",
  con: "moss",
  int: "azure",
  wis: "amethyst",
  cha: "gold",
};

export function isAttributeColorId(value: string): value is AttributeColorId {
  return (ATTRIBUTE_COLOR_IDS as readonly string[]).includes(value);
}

export function assertAttributeColor(value: string): AttributeColorId {
  if (!isAttributeColorId(value)) {
    throw new Error(`Invalid attribute color: ${value}`);
  }
  return value;
}

export function defaultColorForAttributeKey(key: string): AttributeColorId {
  return PRESET_KEY_COLORS[key.trim().toLowerCase()] ?? DEFAULT_ATTRIBUTE_COLOR;
}
