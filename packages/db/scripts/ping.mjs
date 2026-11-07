import postgres from "postgres";

const url =
  process.env.DATABASE_URL ??
  "postgresql://lifequest:lifequest@localhost:5432/lifequest";

const sql = postgres(url);
try {
  const rows = await sql`select 1 as ok`;
  console.log("ok", rows);
} catch (err) {
  console.error("fail", err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
