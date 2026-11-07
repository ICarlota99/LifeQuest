import type { Context } from "hono";
import { DomainValidationError } from "@lifequest/domain";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function handleError(c: Context, err: unknown) {
  if (err instanceof HttpError) {
    return c.json({ error: err.message }, err.status as 400);
  }
  if (err instanceof DomainValidationError) {
    return c.json({ error: err.message }, 400);
  }
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
}
