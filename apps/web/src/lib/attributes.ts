const ATTR_META: Record<string, { label: string; hexClass: string }> = {
  str: { label: "STR", hexClass: "hex-str" },
  dex: { label: "DEX", hexClass: "hex-dex" },
  con: { label: "CON", hexClass: "hex-con" },
  int: { label: "INT", hexClass: "hex-int" },
  wis: { label: "WIS", hexClass: "hex-wis" },
  cha: { label: "CHA", hexClass: "hex-cha" },
};

export function attributeVisual(key: string) {
  const normalized = key.trim().toLowerCase();
  return (
    ATTR_META[normalized] ?? {
      label: normalized.slice(0, 3).toUpperCase() || "???",
      hexClass: "",
    }
  );
}
