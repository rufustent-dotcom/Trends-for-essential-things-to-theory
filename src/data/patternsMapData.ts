/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PatternNode {
  id: string;
  num: number;
  name: string;
  observation: string;
  implication: string;
  opportunity: string;
  color: string;
  iconName: "Cpu" | "Clock" | "Database" | "Maximize" | "Users" | "Target" | "Network";
}

export interface SignalNode {
  id: string;
  num: number;
  name: string;
  stage: string;
  impactDots: Array<"high" | "medium" | "low">; // high = green, medium = orange, low = blue
  iconName: "MessageSquare" | "Activity" | "Cpu" | "Code" | "Briefcase" | "Bot" | "Building" | "Shield";
}

export interface MapConnection {
  from: string; // pattern ID (e.g., "p-1")
  to: string;   // signal ID (e.g., "s-1")
  status: "strong" | "emerging";
}

export const initialPatterns: PatternNode[] = [
  {
    id: "p-1",
    num: 1,
    name: "Automation Replaces Repetition",
    observation: "Repetitive tasks are increasingly automated.",
    implication: "Labor shifts from execution to oversight.",
    opportunity: "Build systems that automate the repeatable.",
    color: "#a855f7", // violet-500
    iconName: "Cpu"
  },
  {
    id: "p-2",
    num: 2,
    name: "AI Compresses Time",
    observation: "Tasks that took hours now take minutes.",
    implication: "Speed becomes a primary advantage.",
    opportunity: "Do more iterations, faster, with leverage.",
    color: "#3b82f6", // blue-500
    iconName: "Clock"
  },
  {
    id: "p-3",
    num: 3,
    name: "Information Becomes Infrastructure",
    observation: "Organized information creates enduring value.",
    implication: "Knowledge systems compound over time.",
    opportunity: "Build knowledge assets, not just content.",
    color: "#10b981", // emerald-500
    iconName: "Database"
  },
  {
    id: "p-4",
    num: 4,
    name: "Systems Scale Better Than Manual Effort",
    observation: "Systems outperform manual processes at scale.",
    implication: "Design once, benefit many times.",
    opportunity: "Build scalable systems and templates.",
    color: "#f59e0b", // amber-500
    iconName: "Maximize"
  },
  {
    id: "p-5",
    num: 5,
    name: "Leverage Multiplies Output",
    observation: "Leverage amplifies impact without linear cost.",
    implication: "Small teams can do outsized work.",
    opportunity: "Focus on high-leverage inputs.",
    color: "#ef4444", // red-500
    iconName: "Users"
  },
  {
    id: "p-6",
    num: 6,
    name: "Clarity Creates Momentum",
    observation: "Clarity removes hesitation and friction.",
    implication: "Clear direction compounds execution.",
    opportunity: "Simplify decisions and priorities.",
    color: "#14b8a6", // teal-500
    iconName: "Target"
  },
  {
    id: "p-7",
    num: 7,
    name: "Adaptation Compounds Advantage",
    observation: "Fast learners adapt and pull ahead.",
    implication: "Adaptation beats static optimization.",
    opportunity: "Build feedback loops and iterate.",
    color: "#ec4899", // pink-500
    iconName: "Network"
  }
];

export const initialSignals: SignalNode[] = [
  {
    id: "s-1",
    num: 1,
    name: "AI Customer Service Expansion",
    stage: "Acceleration – AI replaces tier-1 support.",
    impactDots: ["high", "high", "medium"],
    iconName: "MessageSquare"
  },
  {
    id: "s-2",
    num: 2,
    name: "Enterprise Copilot Adoption",
    stage: "Acceleration – Productivity copilots scale.",
    impactDots: ["high", "high", "medium"],
    iconName: "Activity"
  },
  {
    id: "s-3",
    num: 3,
    name: "GPU & Infrastructure Investment",
    stage: "Acceleration – Compute demand surges.",
    impactDots: ["high", "high", "high"],
    iconName: "Cpu"
  },
  {
    id: "s-4",
    num: 4,
    name: "Open-Source LLM Competition",
    stage: "Acceleration – Open models improve rapidly.",
    impactDots: ["medium", "medium", "low"],
    iconName: "Code"
  },
  {
    id: "s-5",
    num: 5,
    name: "AI Automation Platforms Scale",
    stage: "Consolidation – Platforms dominate workflows.",
    impactDots: ["high", "high", "medium"],
    iconName: "Briefcase"
  },
  {
    id: "s-6",
    num: 6,
    name: "AI Agent Frameworks Growth",
    stage: "Acceleration – Agent tooling matures.",
    impactDots: ["high", "medium", "medium"],
    iconName: "Bot"
  },
  {
    id: "s-7",
    num: 7,
    name: "Enterprise AI Budget Expansion",
    stage: "Acceleration – Budgets shift toward AI.",
    impactDots: ["high", "high", "high"],
    iconName: "Building"
  },
  {
    id: "s-8",
    num: 8,
    name: "Regulation & Governance Increase",
    stage: "Acceleration – Rules and oversight expand.",
    impactDots: ["medium", "low", "low"],
    iconName: "Shield"
  }
];

export const initialConnections: MapConnection[] = [
  // Pattern 1 connects to Signals 1, 5, 6
  { from: "p-1", to: "s-1", status: "strong" },
  { from: "p-1", to: "s-5", status: "strong" },
  { from: "p-1", to: "s-6", status: "strong" },

  // Pattern 2 connects to Signals 1, 2, 6
  { from: "p-2", to: "s-1", status: "strong" },
  { from: "p-2", to: "s-2", status: "strong" },
  { from: "p-2", to: "s-6", status: "strong" },

  // Pattern 3 connects to Signals 3, 4, 8
  { from: "p-3", to: "s-3", status: "strong" },
  { from: "p-3", to: "s-4", status: "strong" },
  { from: "p-3", to: "s-8", status: "strong" },

  // Pattern 4 connects to Signals 1, 3, 5, 6
  { from: "p-4", to: "s-1", status: "strong" },
  { from: "p-4", to: "s-3", status: "strong" },
  { from: "p-4", to: "s-5", status: "strong" },
  { from: "p-4", to: "s-6", status: "strong" },

  // Pattern 5 connects to Signals 2, 5, 7
  { from: "p-5", to: "s-2", status: "strong" },
  { from: "p-5", to: "s-5", status: "strong" },
  { from: "p-5", to: "s-7", status: "strong" },

  // Pattern 6 connects to Signals 6, 7, 8
  { from: "p-6", to: "s-6", status: "strong" },
  { from: "p-6", to: "s-7", status: "strong" },
  { from: "p-6", to: "s-8", status: "strong" },

  // Pattern 7 connects to Signals 4, 6
  { from: "p-7", to: "s-4", status: "strong" },
  { from: "p-7", to: "s-6", status: "strong" },
];
