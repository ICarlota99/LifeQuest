import {
  ATTRIBUTE_COLOR_IDS,
  isAttributeColorId,
  type AttributeColorId,
} from "./attribute-colors.js";
import { MAX_ATTRIBUTES, MAX_SKILLS_PER_ATTRIBUTE } from "./types.js";

export class DomainValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainValidationError";
  }
}

export function assertAttributeColorId(value: string): AttributeColorId {
  if (!isAttributeColorId(value)) {
    throw new DomainValidationError(
      `Attribute color must be one of: ${ATTRIBUTE_COLOR_IDS.join(", ")}.`,
    );
  }
  return value;
}

export function assertAttributeCap(currentCount: number, adding = 1): void {
  if (currentCount + adding > MAX_ATTRIBUTES) {
    throw new DomainValidationError(
      `A character may have at most ${MAX_ATTRIBUTES} attributes.`,
    );
  }
}

export function assertSkillCap(currentCount: number, adding = 1): void {
  if (currentCount + adding > MAX_SKILLS_PER_ATTRIBUTE) {
    throw new DomainValidationError(
      `An attribute may have at most ${MAX_SKILLS_PER_ATTRIBUTE} skills.`,
    );
  }
}

export function assertAttributeScore(
  score: number,
  min: number,
  max: number,
): void {
  if (min > max) {
    throw new DomainValidationError("Attribute min cannot exceed max.");
  }
  if (score < min || score > max) {
    throw new DomainValidationError(
      `Attribute score ${score} is outside [${min}, ${max}].`,
    );
  }
}

export function assertOneActiveCharacter(existingActiveCount: number): void {
  if (existingActiveCount >= 1) {
    throw new DomainValidationError(
      "MVP allows only one active character per user.",
    );
  }
}
