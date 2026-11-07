export const ATTRIBUTE_COLORS = [
  { id: "ember", label: "Ember", from: "#c2410c", to: "#9a3412" },
  { id: "jade", label: "Jade", from: "#0d9488", to: "#0f766e" },
  { id: "moss", label: "Moss", from: "#3f6b3a", to: "#2d4f29" },
  { id: "azure", label: "Azure", from: "#2563eb", to: "#1d4ed8" },
  { id: "amethyst", label: "Amethyst", from: "#7c3aed", to: "#5b21b6" },
  { id: "gold", label: "Gold", from: "#ca8a04", to: "#a16207" },
  { id: "crimson", label: "Crimson", from: "#9f1239", to: "#7f1d1d" },
  { id: "steel", label: "Steel", from: "#64748b", to: "#475569" },
  { id: "bronze", label: "Bronze", from: "#b45309", to: "#92400e" },
  { id: "midnight", label: "Midnight", from: "#312e81", to: "#1e1b4b" },
] as const;

export type AttributeColorId = (typeof ATTRIBUTE_COLORS)[number]["id"];

const COLOR_BY_ID = Object.fromEntries(
  ATTRIBUTE_COLORS.map((c) => [c.id, c]),
) as Record<AttributeColorId, (typeof ATTRIBUTE_COLORS)[number]>;

const KEY_DEFAULT_COLOR: Record<string, AttributeColorId> = {
  str: "ember",
  dex: "jade",
  con: "moss",
  int: "azure",
  wis: "amethyst",
  cha: "gold",
};

/** Normalize to up to 3 alphanumeric chars used as the attribute short code. */
export function normalizeAttrCode(input: string, fallback = "atr"): string {
  const cleaned = input.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 3);
  return cleaned || fallback;
}

export function resolveAttributeColor(
  color: string | null | undefined,
  key?: string,
): AttributeColorId {
  if (color && color in COLOR_BY_ID) return color as AttributeColorId;
  if (key) {
    const fromKey = KEY_DEFAULT_COLOR[normalizeAttrCode(key)];
    if (fromKey) return fromKey;
  }
  return "steel";
}

export function attributeVisual(
  key: string,
  color?: string | null,
) {
  const code = normalizeAttrCode(key);
  const colorId = resolveAttributeColor(color, key);
  const swatch = COLOR_BY_ID[colorId];
  return {
    label: code.toUpperCase() || "???",
    colorId,
    hexClass: `hex-${colorId}`,
    gradient: `linear-gradient(160deg, ${swatch.from}, ${swatch.to})`,
  };
}
