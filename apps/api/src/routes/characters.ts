import { Hono } from "hono";
import { z } from "zod";
import { handleError, HttpError } from "../lib/errors.js";
import {
  assertAllowedPortraitMime,
  assertPortraitUploadSize,
  convertPortraitToWebp,
} from "../lib/portrait.js";
import {
  requireAuth,
  type AuthedVariables,
} from "../middleware/auth.js";
import * as characterService from "../services/characters.js";

const charactersRoutes = new Hono<{ Variables: AuthedVariables }>();
charactersRoutes.use("*", requireAuth);

charactersRoutes.get("/active/sheet", async (c) => {
  try {
    const sheet = await characterService.getCharacterSheet(c.get("userId"));
    return c.json({ sheet });
  } catch (err) {
    return handleError(c, err);
  }
});

charactersRoutes.post("/:id/portrait", async (c) => {
  try {
    const body = await c.req.parseBody({ all: false });
    const file = body.portrait;
    if (!file || typeof file === "string") {
      throw new HttpError(400, "Missing portrait file field.");
    }

    assertAllowedPortraitMime(file.type);
    const arrayBuffer = await file.arrayBuffer();
    const input = Buffer.from(arrayBuffer);
    assertPortraitUploadSize(input.byteLength);

    const webp = await convertPortraitToWebp(input);
    const portrait = await characterService.setPortrait(
      c.get("userId"),
      c.req.param("id"),
      webp,
    );
    return c.json({ portrait }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

charactersRoutes.get("/:id/portrait", async (c) => {
  try {
    const { webp, updatedAt } = await characterService.getPortrait(
      c.get("userId"),
      c.req.param("id"),
    );
    return new Response(webp, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=86400",
        "Last-Modified": updatedAt.toUTCString(),
      },
    });
  } catch (err) {
    return handleError(c, err);
  }
});

charactersRoutes.delete("/:id/portrait", async (c) => {
  try {
    await characterService.clearPortrait(c.get("userId"), c.req.param("id"));
    return c.json({ ok: true });
  } catch (err) {
    return handleError(c, err);
  }
});

charactersRoutes.post("/", async (c) => {
  try {
    const body = z
      .object({
        name: z.string().min(1).max(80),
        className: z.string().max(80).optional(),
        race: z.string().max(80).optional(),
        background: z.string().max(2000).optional(),
        biography: z.string().max(5000).optional(),
        appearance: z.record(z.unknown()).optional(),
      })
      .parse(await c.req.json());
    const character = await characterService.createCharacter(
      c.get("userId"),
      body,
    );
    return c.json({ character }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

charactersRoutes.patch("/:id", async (c) => {
  try {
    const body = z
      .object({
        name: z.string().min(1).max(80).optional(),
        className: z.string().max(80).optional(),
        race: z.string().max(80).optional(),
        background: z.string().max(2000).optional(),
        biography: z.string().max(5000).optional(),
        appearance: z.record(z.unknown()).optional(),
      })
      .parse(await c.req.json());
    const character = await characterService.updateCharacter(
      c.get("userId"),
      c.req.param("id"),
      body,
    );
    return c.json({ character });
  } catch (err) {
    return handleError(c, err);
  }
});

charactersRoutes.post("/attributes", async (c) => {
  try {
    const body = z
      .object({
        characterId: z.string(),
        key: z.string().min(1).max(32),
        name: z.string().min(1).max(80),
        description: z.string().max(2000).optional(),
        color: z.string().min(1).max(32).optional(),
        score: z.number().int().optional(),
        minValue: z.number().int().optional(),
        maxValue: z.number().int().optional(),
      })
      .parse(await c.req.json());
    const attribute = await characterService.createAttribute(
      c.get("userId"),
      body,
    );
    return c.json({ attribute }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

charactersRoutes.patch("/attributes/:id", async (c) => {
  try {
    const body = z
      .object({
        key: z.string().min(1).max(32).optional(),
        name: z.string().min(1).max(80).optional(),
        description: z.string().max(2000).optional(),
        color: z.string().min(1).max(32).optional(),
        score: z.number().int().optional(),
        minValue: z.number().int().optional(),
        maxValue: z.number().int().optional(),
      })
      .parse(await c.req.json());
    const attribute = await characterService.updateAttribute(
      c.get("userId"),
      c.req.param("id"),
      body,
    );
    return c.json({ attribute });
  } catch (err) {
    return handleError(c, err);
  }
});

charactersRoutes.delete("/attributes/:id", async (c) => {
  try {
    await characterService.deleteAttribute(c.get("userId"), c.req.param("id"));
    return c.json({ ok: true });
  } catch (err) {
    return handleError(c, err);
  }
});

charactersRoutes.post("/skills", async (c) => {
  try {
    const body = z
      .object({
        attributeId: z.string(),
        name: z.string().min(1).max(80),
        description: z.string().max(2000).optional(),
      })
      .parse(await c.req.json());
    const skill = await characterService.createSkill(c.get("userId"), body);
    return c.json({ skill }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

charactersRoutes.patch("/skills/:id", async (c) => {
  try {
    const body = z
      .object({
        name: z.string().min(1).max(80).optional(),
        description: z.string().max(2000).optional(),
        sortOrder: z.number().int().min(0).max(100).optional(),
      })
      .parse(await c.req.json());
    const skill = await characterService.updateSkill(
      c.get("userId"),
      c.req.param("id"),
      body,
    );
    return c.json({ skill });
  } catch (err) {
    return handleError(c, err);
  }
});

charactersRoutes.delete("/skills/:id", async (c) => {
  try {
    await characterService.deleteSkill(c.get("userId"), c.req.param("id"));
    return c.json({ ok: true });
  } catch (err) {
    return handleError(c, err);
  }
});

export { charactersRoutes };
