export interface AttributePreset {
  key: string;
  name: string;
  description: string;
  score: number;
  min: number;
  max: number;
  skills: Array<{ name: string; description: string }>;
}

/** Default D&D-inspired sheet used when creating a character. */
export const DEFAULT_ATTRIBUTE_PRESET: AttributePreset[] = [
  {
    key: "str",
    name: "Strength",
    description: "Physical power and functional strength.",
    score: 10,
    min: 1,
    max: 20,
    skills: [
      { name: "Athletics", description: "Running, climbing, and sport performance." },
      { name: "Physical Endurance", description: "Sustained physical effort." },
      { name: "Functional Strength", description: "Lifting, carrying, and resistance training." },
    ],
  },
  {
    key: "dex",
    name: "Dexterity",
    description: "Agility, coordination, and precision.",
    score: 10,
    min: 1,
    max: 20,
    skills: [
      { name: "Agility", description: "Speed, mobility, and footwork." },
      { name: "Coordination", description: "Fine motor control and timing." },
      { name: "Precision", description: "Accuracy in skilled physical tasks." },
    ],
  },
  {
    key: "con",
    name: "Constitution",
    description: "Health, resilience, and consistency.",
    score: 10,
    min: 1,
    max: 20,
    skills: [
      { name: "Resilience", description: "Recovering from setbacks and stress." },
      { name: "Recovery", description: "Sleep, rest, and healing habits." },
      { name: "Physical Consistency", description: "Showing up for health routines." },
    ],
  },
  {
    key: "int",
    name: "Intelligence",
    description: "Learning, reasoning, and technical skill.",
    score: 10,
    min: 1,
    max: 20,
    skills: [
      { name: "Learning", description: "Absorbing and retaining new knowledge." },
      { name: "Problem Solving", description: "Analyzing and solving hard problems." },
      { name: "Technical Knowledge", description: "Domain expertise and tools." },
    ],
  },
  {
    key: "wis",
    name: "Wisdom",
    description: "Insight, awareness, and emotional regulation.",
    score: 10,
    min: 1,
    max: 20,
    skills: [
      { name: "Insight", description: "Understanding situations and people." },
      { name: "Perception", description: "Noticing details and patterns." },
      { name: "Emotional Regulation", description: "Managing emotions under pressure." },
    ],
  },
  {
    key: "cha",
    name: "Charisma",
    description: "Communication, persuasion, and leadership.",
    score: 10,
    min: 1,
    max: 20,
    skills: [
      { name: "Communication", description: "Clear written and spoken expression." },
      { name: "Persuasion", description: "Influencing with integrity." },
      { name: "Leadership", description: "Guiding and motivating others." },
      { name: "Social Confidence", description: "Comfort in social settings." },
    ],
  },
];
