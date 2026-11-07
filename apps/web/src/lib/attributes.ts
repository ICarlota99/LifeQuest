const ATTR_HEX: Record<string, string> = {
  str: "hex-str",
  dex: "hex-dex",
  con: "hex-con",
  int: "hex-int",
  wis: "hex-wis",
  cha: "hex-cha",
};

/** Normalize to up to 3 alphanumeric chars used as the attribute short code. */
export function normalizeAttrCode(input: string, fallback = "atr"): string {
  const cleaned = input.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 3);
  return cleaned || fallback;
}

export function attributeVisual(key: string) {
  const code = normalizeAttrCode(key);
  return {
    label: code.toUpperCase() || "???",
    hexClass: ATTR_HEX[code] ?? "",
  };
}
