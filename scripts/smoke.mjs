const base = "http://localhost:3001";

async function req(path, { method = "GET", body, cookie } = {}) {
  const headers = {
    Origin: "http://localhost:5173",
  };
  if (body) headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data, setCookie };
}

function mergeCookie(existing, setCookie) {
  const jar = new Map();
  for (const part of (existing ?? "").split(";").map((s) => s.trim()).filter(Boolean)) {
    const [k, ...rest] = part.split("=");
    jar.set(k, rest.join("="));
  }
  for (const raw of setCookie) {
    const [pair] = raw.split(";");
    const [k, ...rest] = pair.split("=");
    jar.set(k, rest.join("="));
  }
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

const email = `smoke_${Date.now()}@lifequest.test`;
let cookie = "";

const health = await req("/health");
console.log("health", health.status, health.data);

const signup = await req("/api/auth/sign-up/email", {
  method: "POST",
  body: { name: "Smoke Tester", email, password: "password123" },
});
cookie = mergeCookie(cookie, signup.setCookie);
console.log("signup", signup.status, signup.data?.user?.email ?? signup.data);

const character = await req("/api/characters", {
  method: "POST",
  cookie,
  body: { name: "Smoke Hero", className: "Ranger", race: "Human" },
});
console.log("character", character.status, character.data?.character?.name);

const sheet = await req("/api/characters/active/sheet", { cookie });
console.log(
  "sheet",
  sheet.status,
  sheet.data?.sheet?.attributes?.length,
  "attrs",
  sheet.data?.sheet?.attributes?.[0]?.skills?.length,
  "skills on first attr",
);

const campaign = await req("/api/campaigns", {
  method: "POST",
  cookie,
  body: {
    title: "Smoke Campaign",
    mainObjective: "Verify the loop",
    difficulty: 3,
  },
});
const campaignId = campaign.data?.campaign?.id;
console.log("campaign", campaign.status, campaignId);

const skillId = sheet.data?.sheet?.attributes?.[3]?.skills?.[0]?.id; // INT Learning
const quest = await req(`/api/campaigns/${campaignId}/quests`, {
  method: "POST",
  cookie,
  body: {
    title: "Write the smoke test",
    difficulty: 3,
    skillLinks: skillId ? [{ skillId, weight: 100 }] : [],
  },
});
console.log("quest", quest.status, quest.data?.quest?.id);

const boss = await req(`/api/campaigns/${campaignId}/bosses`, {
  method: "POST",
  cookie,
  body: { title: "Flaky CI Dragon", maxHp: 50 },
});
const bossId = boss.data?.boss?.id;
console.log("boss", boss.status, bossId);

const habit = await req(`/api/campaigns/${campaignId}/habits`, {
  method: "POST",
  cookie,
  body: {
    title: "Daily smoke check",
    difficulty: 2,
    bossId,
    skillLinks: skillId ? [{ skillId, weight: 100 }] : [],
  },
});
console.log("habit", habit.status, habit.data?.habit?.id);

const complete = await req("/api/completions", {
  method: "POST",
  cookie,
  body: {
    sourceType: "habit",
    sourceId: habit.data?.habit?.id,
    idempotencyKey: `smoke_${Date.now()}`,
  },
});
console.log(
  "complete",
  complete.status,
  "xp",
  complete.data?.award?.characterXp,
  "gold",
  complete.data?.gold?.amount,
  "bossHp",
  complete.data?.bossResult?.currentHp,
);

const dup = await req("/api/completions", {
  method: "POST",
  cookie,
  body: {
    sourceType: "habit",
    sourceId: habit.data?.habit?.id,
    idempotencyKey: `smoke_dup_${Date.now()}`,
  },
});
console.log("duplicate-day", dup.status, dup.data?.error ?? dup.data?.duplicate);

const inventory = await req("/api/inventory", { cookie });
console.log("inventory gold", inventory.data?.goldBalance);

console.log("SMOKE_OK");
