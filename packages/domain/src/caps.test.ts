import { describe, expect, it } from "vitest";
import {
  assertAttributeCap,
  assertOneActiveCharacter,
  assertSkillCap,
  DomainValidationError,
} from "./caps.js";

describe("caps", () => {
  it("blocks more than 6 attributes", () => {
    expect(() => assertAttributeCap(6)).toThrow(DomainValidationError);
    expect(() => assertAttributeCap(5)).not.toThrow();
  });

  it("blocks more than 6 skills per attribute", () => {
    expect(() => assertSkillCap(6)).toThrow(DomainValidationError);
  });

  it("blocks second active character", () => {
    expect(() => assertOneActiveCharacter(1)).toThrow(DomainValidationError);
  });
});
