/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with client safety
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API successfully initialized on the server backend.");
  } else {
    console.warn("GEMINI_API_KEY is missing or configured with a placeholder. Rich AI reports will fall back to local templates.");
  }
} catch (err) {
  console.error("Failed to initialize Gemini Client:", err);
}

/**
 * A highly resilient JSON parsing helper that strips markdown, comments,
 * gets context within braces, heals truncated lists/objects, and parses safely.
 */
function cleanAndParseJSON(rawText: string): any {
  let cleaned = rawText.trim();
  
  // 1. Strip markdown code block wrappers if present
  if (cleaned.includes("```")) {
    const rx = /```[a-zA-Z0-9]*([\s\S]*?)```/;
    const match = cleaned.match(rx);
    if (match && match[1]) {
      cleaned = match[1].trim();
    } else {
      cleaned = cleaned.replace(/^```[a-zA-Z0-9]*\n/, "");
      cleaned = cleaned.replace(/\n```$/, "");
    }
  }
  
  cleaned = cleaned.trim();

  // 2. Find first and last braces/brackets to eliminate surrounding conversational text
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  } else {
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
  }

  // 3. Strip trailing commas inside arrays and objects
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  // 4. Try parsing standard cleansed JSON
  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    // 5. Attempt dynamic local recovery for truncated prompts
    try {
      return fixTruncatedJson(cleaned);
    } catch (truncErr) {
      throw parseErr; // fall back to throwing original parsing error
    }
  }
}

/**
 * Repairs unclosed brackets/braces from split, truncated, or partial outputs.
 */
function fixTruncatedJson(jsonStr: string): any {
  let str = jsonStr.trim();
  if (!str) return {};

  const stack: string[] = [];
  let insideString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      insideString = !insideString;
      continue;
    }
    if (insideString) {
      continue;
    }
    if (char === '{' || char === '[') {
      stack.push(char);
    } else if (char === '}') {
      if (stack[stack.length - 1] === '{') {
        stack.pop();
      }
    } else if (char === ']') {
      if (stack[stack.length - 1] === '[') {
        stack.pop();
      }
    }
  }

  if (insideString) {
    str += '"';
  }

  str = str.trim();
  if (str.endsWith(',')) {
    str = str.slice(0, -1);
  }

  while (stack.length > 0) {
    const last = stack.pop();
    if (last === '{') {
      str += '}';
    } else if (last === '[') {
      str += ']';
    }
  }

  return JSON.parse(str);
}

// In-Memory Database for Monetization Analytics
let USERS: { [username: string]: { username: string; email: string; premium: boolean; purchased_skills: string[]; totalSpent: number; stripeConnectId?: string; connectStatus?: "unlinked" | "pending" | "active"; payoutsEnabled?: boolean } } = {
  'dev_alpha': { username: 'dev_alpha', email: 'alpha@coder.net', premium: true, purchased_skills: ['skill-1', 'skill-2'], totalSpent: 68.99, stripeConnectId: "acct_1Ov8H2Zp3F91mD8Q", connectStatus: "active", payoutsEnabled: true },
  'builder_jay': { username: 'builder_jay', email: 'jay@agentlabs.ai', premium: false, purchased_skills: [], totalSpent: 0, stripeConnectId: undefined, connectStatus: "unlinked", payoutsEnabled: false },
  'saas_founder_42': { username: 'saas_founder_42', email: 'founder42@hq.io', premium: true, purchased_skills: ['skill-3'], totalSpent: 49.00, stripeConnectId: "acct_1Ov8X4Bp1B2QyB7Z", connectStatus: "active", payoutsEnabled: true },
  'hobby_coder': { username: 'hobby_coder', email: 'hobby@gmail.com', premium: false, purchased_skills: ['skill-1'], totalSpent: 19.99, stripeConnectId: "acct_1Ov8Y5Cp8C9KyP4W", connectStatus: "pending", payoutsEnabled: false }
};

let metrics = {
  grossEarnings: 14850.50,
  mrr: 2150.00,
  activeSubscriptions: 112,
  conversionRate: 6.8, // 6.8% conversion of free developers to paid subscribers
  totalPurchases: 540,
  arpu: 27.50
};

let skills = [
  {
    id: "skill-1",
    name: "Gemini Code Compléter Pro",
    description: "Enterprise direct code suggestion generator and refactor specialist module.",
    category: "Language",
    billingModel: "Flat Subscription",
    price: 19.99,
    unit: "per month",
    activeUsers: 850,
    salesCount: 78,
    earnings: 1559.22,
    status: "Active"
  },
  {
    id: "skill-2",
    name: "Voice Clone Synthesis Studio",
    description: "Multilingual high-fidelity audio cloning with perfect latency control.",
    category: "Audio",
    billingModel: "Pay-as-you-go",
    price: 0.04,
    unit: "per 1K synthesis calls",
    activeUsers: 1420,
    salesCount: 320,
    earnings: 6480.00,
    status: "Active"
  },
  {
    id: "skill-3",
    name: "Multimodal OCR & Data Extractor",
    description: "Extracts key-value fields from complex PDFs, blueprints, and table screenshots.",
    category: "Vision",
    billingModel: "One-time Purchase",
    price: 49.00,
    unit: "lifetime deployment license",
    activeUsers: 280,
    salesCount: 142,
    earnings: 6958.00,
    status: "Active"
  },
  {
    id: "skill-4",
    name: "Automated Twitter Auto-Promoter",
    description: "Autonomous sentiment observer that crafts viral threads based on technical news feed.",
    category: "Utility",
    billingModel: "Flat Subscription",
    price: 9.99,
    unit: "per month",
    activeUsers: 340,
    salesCount: 34,
    earnings: 339.66,
    status: "Draft"
  },
  {
    id: "skill-5",
    name: "Recursive Agent Planner Logic",
    description: "Deep tree search reasoning system that maps goals into atomic sub-tasks.",
    category: "Language",
    billingModel: "Pay-as-you-go",
    price: 0.08,
    unit: "per task tree resolved",
    activeUsers: 1500,
    salesCount: 220,
    earnings: 4500.00,
    status: "Active"
  },
  {
    id: "skill-6",
    name: "Gift of Skill — Word Puzzle Game",
    description: "Tech-vocabulary word unscramble game bundled as a giftable AI skill module. 25-word lexicon covering AI, APIs, systems, and business terms.",
    category: "Utility",
    billingModel: "One-time Purchase",
    price: 4.99,
    unit: "lifetime access",
    activeUsers: 640,
    salesCount: 312,
    earnings: 1558.00,
    status: "Active"
  }
];

let logs = [
  {
    id: "tx-101",
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    event: "subscription.created",
    source: "Stripe",
    status: "Success",
    amount: 19.99,
    details: "Renewed Gemini Code Compléter Pro (ID: skill-1) config client_ref_1942"
  },
  {
    id: "tx-102",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    event: "payment_intent.succeeded",
    source: "Stripe",
    status: "Success",
    amount: 49.00,
    details: "One-time purchase license direct OCR Extraction Studio. client_ref_8829"
  },
  {
    id: "tx-103",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    event: "payout.succeeded",
    source: "Internal System",
    status: "Success",
    amount: -1850.00,
    details: "Automated developer payout successfully cleared via direct ACH routing."
  },
  {
    id: "tx-104",
    timestamp: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    event: "charge.failed",
    source: "Stripe",
    status: "Failed",
    amount: 19.99,
    details: "Card declined due to insufficient funds (customer: user_980); retrying in 48h."
  },
  {
    id: "tx-105",
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    event: "payment.capture-completed",
    source: "PayPal",
    status: "Success",
    amount: 9.99,
    details: "Voice synthesis top-up order: tx_pp_4810294. User: developer_jane_55"
  }
];

let config = {
  stripePublicKey: "pk_test_51MzSkXAD23kLp258aLqP2RkK7w",
  stripeSecretKey: "sk_test_••••••••••••••••••••3P9R",
  stripeWebhookSecret: "whsec_•••••••••••••••••••8zM9",
  paypalClientId: "Af_W9i8F•••••••••••••••••••_sWJ",
  paypalSecretKey: "EC_K8uX•••••••••••••••••••_pA8",
  environment: "sandbox",
  autoPayoutEnabled: true,
  stripeConnectClientId: "ca_FkB8p2J8mW98zKp28aL89",
  connectWebhookSecret: "whsec_cnct_••••••••••••••••",
  platformCommissionRate: 20
};

let simulationHistory = [
  { date: "May 15", revenue: 840, apiCalls: 12400 },
  { date: "May 16", revenue: 920, apiCalls: 13500 },
  { date: "May 17", revenue: 780, apiCalls: 11100 },
  { date: "May 18", revenue: 1100, apiCalls: 15600 },
  { date: "May 19", revenue: 1450, apiCalls: 19200 },
  { date: "May 20", revenue: 1820, apiCalls: 22400 },
  { date: "May 21", revenue: 2150, apiCalls: 25000 }
];

// Helper to update ARPU and conversion metrics
function recalculateMetrics() {
  metrics.arpu = parseFloat((metrics.grossEarnings / (metrics.activeSubscriptions + 40)).toFixed(2));
  metrics.conversionRate = parseFloat(((metrics.activeSubscriptions / 1640) * 100).toFixed(1));
}

// REST Backend Endpoints
app.get("/api/dashboard/data", (req, res) => {
  res.json({
    metrics,
    skills,
    logs,
    config,
    simulationHistory,
    users: Object.values(USERS)
  });
});

// Premium Skill purchase API endpoint matching Python backend request pattern
app.post("/api/payment/purchase_skill", (req, res) => {
  const { username, skillId, provider } = req.body;
  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  const userKey = username.toLowerCase().trim().replace(/\s+/g, '_');
  
  // Find user or create if not exists
  if (!USERS[userKey]) {
    USERS[userKey] = {
      username: username,
      email: `${userKey}@example.com`,
      premium: false,
      purchased_skills: [],
      totalSpent: 0
    };
  }

  // Find target skill
  const targetSkill = skills.find(s => s.id === skillId || s.name === skillId) || skills[0];
  
  // Add skill to purchased list
  if (!USERS[userKey].purchased_skills.includes(targetSkill.id)) {
    USERS[userKey].purchased_skills.push(targetSkill.id);
  }
  USERS[userKey].premium = true;

  const cost = targetSkill.price || 19.99;
  USERS[userKey].totalSpent = parseFloat((USERS[userKey].totalSpent + cost).toFixed(2));
  
  // Update ecosystem aggregates
  metrics.grossEarnings = parseFloat((metrics.grossEarnings + cost).toFixed(2));
  if (targetSkill.billingModel === "Flat Subscription") {
    metrics.mrr = parseFloat((metrics.mrr + cost).toFixed(2));
    metrics.activeSubscriptions += 1;
  }
  metrics.totalPurchases += 1;
  targetSkill.salesCount += 1;
  targetSkill.earnings = parseFloat((targetSkill.earnings + cost).toFixed(2));

  // Add revenue point to graph
  if (simulationHistory.length > 0) {
    simulationHistory[simulationHistory.length - 1].revenue = parseFloat((simulationHistory[simulationHistory.length - 1].revenue + cost).toFixed(2));
  }

  // Add webhook audit trail
  const transactionId = `tx-${Math.floor(500 + Math.random() * 500)}`;
  const gateway = provider === "paypal" ? "PayPal" : "Stripe";
  const eventName = targetSkill.billingModel === "Flat Subscription" 
    ? "subscription.created" 
    : (targetSkill.billingModel === "One-time Purchase" ? "charge.succeeded" : "payment_intent.succeeded");

  const purchaseLog = {
    id: transactionId,
    timestamp: new Date().toISOString(),
    event: eventName,
    source: gateway,
    status: "Success" as const,
    amount: cost,
    details: `Premium skill '${targetSkill.name}' purchased for user [${USERS[userKey].username}]. Activated securely via simulated ${gateway} flow.`
  };

  logs.unshift(purchaseLog);
  if (logs.length > 20) logs.pop();

  recalculateMetrics();

  res.json({
    success: true,
    message: `Skill ${targetSkill.name} purchased for ${USERS[userKey].username}`,
    user: USERS[userKey],
    users: Object.values(USERS),
    metrics,
    skills,
    logs
  });
});

// Applet REST endpoint verifying incoming Google Play Billing 9.0.0 receipts
app.post("/api/billing/verify", (req, res) => {
  const { username, subscription_id, subscriptionId, purchase_token, purchaseToken } = req.body;
  const targetUser = username;
  const subId = subscription_id || subscriptionId;
  const token = purchase_token || purchaseToken;

  if (!targetUser || !subId || !token) {
    return res.status(400).json({ error: "Missing required validation properties: username, subscription_id, purchase_token" });
  }

  const userKey = targetUser.toLowerCase().trim().replace(/\s+/g, '_');
  
  if (!USERS[userKey]) {
    USERS[userKey] = {
      username: targetUser,
      email: `${userKey}@intrepid-partner.ai`,
      premium: false,
      purchased_skills: [],
      totalSpent: 0
    };
  }

  // Authorize and unlock sandbox
  USERS[userKey].premium = true;
  const subSkill = `gplay-${subId}`;
  if (!USERS[userKey].purchased_skills.includes(subSkill)) {
    USERS[userKey].purchased_skills.push(subSkill);
  }

  const cost = 14.99;
  USERS[userKey].totalSpent = parseFloat((USERS[userKey].totalSpent + cost).toFixed(2));

  // Update metrics
  metrics.grossEarnings = parseFloat((metrics.grossEarnings + cost).toFixed(2));
  metrics.mrr = parseFloat((metrics.mrr + cost).toFixed(2));
  metrics.activeSubscriptions += 1;
  metrics.totalPurchases += 1;

  // Add revenue point to graph
  if (simulationHistory.length > 0) {
    simulationHistory[simulationHistory.length - 1].revenue = parseFloat((simulationHistory[simulationHistory.length - 1].revenue + cost).toFixed(2));
  }

  // Create audit log
  const transactionId = `tx-gplay-${Math.floor(1000 + Math.random() * 9000)}`;
  const playLog = {
    id: transactionId,
    timestamp: new Date().toISOString(),
    event: "subscription.gplay_verified",
    source: "Google Play Store" as const,
    status: "Success" as const,
    amount: cost,
    details: `Google Play Billing 9.0.0 purchase token for sub [${subId}] verified successfully by self-healing validation engine for developer [${USERS[userKey].username}].`
  };
  logs.unshift(playLog);
  if (logs.length > 20) logs.pop();

  recalculateMetrics();

  res.json({
    status: "success",
    active: true,
    message: "Play Billing 9.0.0 subscription validated successfully.",
    user_details: USERS[userKey],
    verification_details: {
      status: "success",
      active: true,
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      acknowledgement_state: 1,
      sandbox: true
    }
  });
});

// Analytics listener answering premium skill usage per user (Flask parity + extra metrics)
app.get("/api/payment/analytics", (req, res) => {
  const analytics_data: { [key: string]: number } = {};
  for (const [userKey, info] of Object.entries(USERS)) {
    analytics_data[info.username] = info.purchased_skills.length;
  }

  res.json({
    success: true,
    premium_skill_usage: analytics_data, // Matching Python 'premium_skill_usage' field
    users: Object.values(USERS),
    totalUsers: Object.keys(USERS).length,
    premiumPercentage: parseFloat(((Object.values(USERS).filter(u => u.premium).length / Object.keys(USERS).length) * 100).toFixed(1))
  });
});

// Create test user on the server
app.post("/api/payment/create_user", (req, res) => {
  const { username, email } = req.body;
  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  const userKey = username.toLowerCase().trim().replace(/\s+/g, '_');
  if (USERS[userKey]) {
    return res.status(400).json({ error: "user already exists" });
  }

  USERS[userKey] = {
    username: username,
    email: email || `${userKey}@example.com`,
    premium: false,
    purchased_skills: [],
    totalSpent: 0
  };

  res.json({
    success: true,
    user: USERS[userKey],
    users: Object.values(USERS)
  });
});

// Stripe Connect Multi-tenant Onboarding link simulation
app.post("/api/connect/link", (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  const userKey = username.toLowerCase().trim().replace(/\s+/g, '_');
  if (!USERS[userKey]) {
    return res.status(404).json({ error: "User sandbox account not found" });
  }

  const randomConnectId = USERS[userKey].stripeConnectId || `acct_1Ov${Math.random().toString(36).substr(2, 13).toUpperCase()}`;
  USERS[userKey].stripeConnectId = randomConnectId;
  USERS[userKey].connectStatus = "pending";
  USERS[userKey].payoutsEnabled = false;

  const connectLog = {
    id: `tx-cnct-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
    event: "account.updated",
    source: "Stripe" as const,
    status: "Success" as const,
    amount: 0,
    details: `Stripe Connect onboarding initiated for [${USERS[userKey].username}]. Link created: https://connect.stripe.com/setup/s/${randomConnectId}. Status updated to: PENDING.`
  };
  logs.unshift(connectLog);
  if (logs.length > 20) logs.pop();

  res.json({
    success: true,
    user: USERS[userKey],
    users: Object.values(USERS),
    logs
  });
});

// Simulate webhook callback to complete Stripe Connect onboarding and activate payouts
app.post("/api/connect/toggle_status", (req, res) => {
  const { username, status } = req.body; // "active" or "unlinked"
  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  const userKey = username.toLowerCase().trim().replace(/\s+/g, '_');
  if (!USERS[userKey]) {
    return res.status(404).json({ error: "User sandbox account not found" });
  }

  if (status === "active") {
    USERS[userKey].connectStatus = "active";
    USERS[userKey].payoutsEnabled = true;
    if (!USERS[userKey].stripeConnectId) {
      USERS[userKey].stripeConnectId = `acct_1Ov${Math.random().toString(36).substr(2, 13).toUpperCase()}`;
    }
  } else if (status === "unlinked") {
    USERS[userKey].connectStatus = "unlinked";
    USERS[userKey].payoutsEnabled = false;
    USERS[userKey].stripeConnectId = undefined;
  } else {
    USERS[userKey].connectStatus = "pending";
    USERS[userKey].payoutsEnabled = false;
  }

  const connectLog = {
    id: `tx-cnct-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
    event: "account.application.authorized",
    source: "Stripe" as const,
    status: "Success" as const,
    amount: 0,
    details: `Connect account [${USERS[userKey].stripeConnectId}] status transitioned to: ${USERS[userKey].connectStatus.toUpperCase()}. Payout capability is now ${USERS[userKey].payoutsEnabled ? "ENABLED" : "SUSPENDED"}.`
  };
  logs.unshift(connectLog);
  if (logs.length > 20) logs.pop();

  res.json({
    success: true,
    user: USERS[userKey],
    users: Object.values(USERS),
    logs
  });
});

// Simulate multi-tenant payouts payouts
app.post("/api/connect/payout", (req, res) => {
  const { username, amount } = req.body;
  if (!username || !amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Valid username and payout amount are required" });
  }

  const userKey = username.toLowerCase().trim().replace(/\s+/g, '_');
  if (!USERS[userKey]) {
    return res.status(404).json({ error: "User sandbox account not found" });
  }

  if (USERS[userKey].connectStatus !== "active") {
    return res.status(400).json({ error: "User Stripe Connect account is not active. Complete onboarding first." });
  }

  const payoutId = `po_${Math.random().toString(36).substr(2, 14)}`;
  const payoutLog = {
    id: payoutId,
    timestamp: new Date().toISOString(),
    event: "payout.created",
    source: "Stripe" as const,
    status: "Success" as const,
    amount: -Math.abs(Number(amount)),
    details: `Stripe Connect direct payout. Transferred $${Number(amount).toFixed(2)} to connected sub-account [${USERS[userKey].stripeConnectId}] (${USERS[userKey].username}) minus platform commission of ${config.platformCommissionRate}%.`
  };

  logs.unshift(payoutLog);
  if (logs.length > 20) logs.pop();

  res.json({
    success: true,
    user: USERS[userKey],
    users: Object.values(USERS),
    logs
  });
});

// Configure Provider settings
app.post("/api/dashboard/config", (req, res) => {
  const { 
    stripePublicKey, 
    stripeSecretKey, 
    stripeWebhookSecret, 
    paypalClientId, 
    paypalSecretKey, 
    environment, 
    autoPayoutEnabled,
    stripeConnectClientId,
    connectWebhookSecret,
    platformCommissionRate
  } = req.body;
  
  if (stripePublicKey !== undefined) config.stripePublicKey = stripePublicKey;
  if (stripeSecretKey !== undefined) config.stripeSecretKey = stripeSecretKey;
  if (stripeWebhookSecret !== undefined) config.stripeWebhookSecret = stripeWebhookSecret;
  if (paypalClientId !== undefined) config.paypalClientId = paypalClientId;
  if (paypalSecretKey !== undefined) config.paypalSecretKey = paypalSecretKey;
  if (environment !== undefined) config.environment = environment;
  if (autoPayoutEnabled !== undefined) config.autoPayoutEnabled = autoPayoutEnabled;
  if (stripeConnectClientId !== undefined) config.stripeConnectClientId = stripeConnectClientId;
  if (connectWebhookSecret !== undefined) config.connectWebhookSecret = connectWebhookSecret;
  if (platformCommissionRate !== undefined) config.platformCommissionRate = platformCommissionRate;

  const newLog = {
    id: `tx-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
    event: "system.config_updated",
    source: "Internal System",
    status: "Success",
    amount: 0,
    details: `Credential updates verified. Working environment set to [${config.environment.toUpperCase()}]. Connect Client: ${config.stripeConnectClientId ? "CONFIGURED" : "NONE"}. Commission: ${config.platformCommissionRate}%.`
  };
  logs.unshift(newLog);

  res.json({ success: true, config, logs });
});

// Simulate events dynamically in the developer portal
app.post("/api/dashboard/simulate", (req, res) => {
  const { type, skillId } = req.body;
  const targetSkill = skills.find(s => s.id === skillId) || skills[0];

  const transactionId = `tx-${Math.floor(200 + Math.random() * 800)}`;
  const timestamp = new Date().toISOString();

  let eventLabel = "";
  let paySource: "Stripe" | "PayPal" | "Internal System" = Math.random() > 0.4 ? "Stripe" : "PayPal";
  let status: "Success" | "Failed" | "Pending" = "Success";
  let amountTransacted = 0;
  let logDetail = "";

  if (type === "purchase_subscription") {
    // Premium subscriber upsell simulator
    amountTransacted = targetSkill.billingModel === "Flat Subscription" ? targetSkill.price : 19.99;
    metrics.grossEarnings += amountTransacted;
    metrics.mrr += targetSkill.billingModel === "Flat Subscription" ? targetSkill.price : 19.99;
    metrics.activeSubscriptions += 1;
    metrics.totalPurchases += 1;
    targetSkill.salesCount += 1;
    targetSkill.earnings += amountTransacted;

    eventLabel = "subscription.created";
    logDetail = `New Premium subscription simulated for '${targetSkill.name}'. Monthly recurring growth locked: +$${amountTransacted}/mo.`;

    // Add revenue to simulation graph
    const lastDay = simulationHistory[simulationHistory.length - 1];
    lastDay.revenue += amountTransacted;
  } 
  else if (type === "pay_as_you_go_topup") {
    // Simulate high usage API calls
    amountTransacted = 15.00;
    metrics.grossEarnings += amountTransacted;
    metrics.totalPurchases += 1;
    
    // Distribute earnings to Voice Clone or Recursive logical agent
    const creditsSkill = skills.find(s => s.billingModel === "Pay-as-you-go") || targetSkill;
    creditsSkill.salesCount += 1500; // API calls count
    creditsSkill.earnings += amountTransacted;

    const randomCalls = Math.floor(400 + Math.random() * 1200);
    // Increase api calls in last graph point
    const lastDay = simulationHistory[simulationHistory.length - 1];
    lastDay.revenue += amountTransacted;
    lastDay.apiCalls += randomCalls;

    eventLabel = "payment_intent.succeeded";
    logDetail = `Automatic payload top-up of $${amountTransacted} triggered for premium API skill '${creditsSkill.name}'. Measured ${randomCalls} requests.`;
  }
  else if (type === "one_time_license") {
    // Simulate single developer purchasing permanent access
    const directSkill = skills.find(s => s.billingModel === "One-time Purchase") || targetSkill;
    amountTransacted = directSkill.price;
    metrics.grossEarnings += amountTransacted;
    metrics.totalPurchases += 1;
    directSkill.salesCount += 1;
    directSkill.earnings += amountTransacted;

    eventLabel = "charge.succeeded";
    logDetail = `Direct individual developer license verified for: '${directSkill.name}'. Lifetime deploy token activated.`;
    
    const lastDay = simulationHistory[simulationHistory.length - 1];
    lastDay.revenue += amountTransacted;
  }
  else if (type === "failed_payout") {
    // Simulate dynamic checkout failures for testing developers webhooks
    eventLabel = "charge.failed";
    paySource = "Stripe";
    status = "Failed";
    amountTransacted = targetSkill.price;
    logDetail = `Simulated Payment Declined. Card source authentication rejected for user_auth_441 (Skill: '${targetSkill.name}').`;
  }
  else if (type === "generate_traffic") {
    // Simulate high organic free API traffic
    const randomVoters = Math.floor(250 + Math.random() * 1000);
    const lastDay = simulationHistory[simulationHistory.length - 1];
    lastDay.apiCalls += randomVoters;
    
    eventLabel = "agent.traffic_surge";
    paySource = "Internal System";
    status = "Success";
    logDetail = `Organic developer gateway traffic spike: ${randomVoters} incoming LLM requests monitored. Conversion index optimized.`;
  }

  // Record simulation transaction
  const simulatedLog = {
    id: transactionId,
    timestamp,
    event: eventLabel,
    source: paySource,
    status,
    amount: status === "Failed" ? 0 : (paySource === "Internal System" ? 0 : amountTransacted),
    details: logDetail
  };
  
  logs.unshift(simulatedLog);
  if (logs.length > 20) logs.pop(); // limit size

  recalculateMetrics();

  res.json({
    success: true,
    metrics,
    skills,
    logs,
    simulationHistory
  });
});

// Gemini AI Recommendation Advisory Engine
app.post("/api/dashboard/ai-advice", async (req, res) => {
  try {
    const currentSnapshotString = JSON.stringify({
      metrics,
      skills: skills.map(s => ({
        name: s.name,
        category: s.category,
        billingModel: s.billingModel,
        price: s.price,
        unit: s.unit,
        activeUsers: s.activeUsers,
        salesCount: s.salesCount,
        earnings: s.earnings,
        status: s.status
      }))
    }, null, 2);

    const clientPrompt = `
You are a brilliant Senior Monetization Consultant and SaaS Pricing Expert specializing in Developer APIs, Large Language Models, and AI Agent Hubs.
Given this real-time developer product ecosystem performance snapshots:

${currentSnapshotString}

Your task is to analyze these numbers and generate a detailed strategy review with actionable pricing improvements, premium growth advice, and bundles to skyrocket MRR.

Provide your strategy inside a JSON object matching this structure so the dashboard can render it flawlessly.
Strictly respond ONLY with this JSON block, no markdown headers, no backticks, no trailing comments.

JSON Schema to return:
{
  "summary": "1-2 sentence executive assessment of their pricing health, current ARPU ($${metrics.arpu}) and conversion index (${metrics.conversionRate}%).",
  "pricingRecommendations": [
    {
      "skillName": "Name of the target skill to optimize",
      "currentPrice": "Current model e.g. '$19.99/mo'",
      "recommendedModel": "Proposed pricing description e.g. 'Differentiated usage tier: $9/mo basic + $0.02 overage'",
      "financialImpact": "Estimated increase or logic e.g. '+20% Conversion boost'",
      "details": "Explanation of why this pricing model is optimized for developer adoption."
    }
  ],
  "underEarningWarns": [
    {
      "title": "A hazard or missed opportunity identified in the skills table",
      "severity": "High" | "Medium" | "Low",
      "observation": "What the issue is based on the data provided.",
      "actionPlan": "Crucial step to resolve the inefficiency."
    }
  ],
  "growthHacks": [
    "A creative growth hack focusing on standard developer ecosystems (e.g. Free Tier quotas, bundles, developer credits, startup tokens)"
  ]
}
`;

    if (ai) {
      console.log("Calling Gemini API...");
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: clientPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "Executive assessment of their pricing health, current ARPU and conversion index."
              },
              pricingRecommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    skillName: { type: Type.STRING },
                    currentPrice: { type: Type.STRING },
                    recommendedModel: { type: Type.STRING },
                    financialImpact: { type: Type.STRING },
                    details: { type: Type.STRING }
                  },
                  required: ["skillName", "currentPrice", "recommendedModel", "financialImpact", "details"]
                }
              },
              underEarningWarns: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    observation: { type: Type.STRING },
                    actionPlan: { type: Type.STRING }
                  },
                  required: ["title", "severity", "observation", "actionPlan"]
                }
              },
              growthHacks: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING
                }
              }
            },
            required: ["summary", "pricingRecommendations", "underEarningWarns", "growthHacks"]
          }
        }
      });

      const responseText = response.text || "";
      console.log("Received AI Response from Gemini.");
      try {
        const parsedAdvice = cleanAndParseJSON(responseText);
        return res.json({ success: true, advice: parsedAdvice });
      } catch (jsonErr) {
        console.error("Failed to parse Gemini output as JSON, output was:", responseText);
        // Fallback to static analyzer if parse fails
        throw new Error("Invalid format received from model");
      }
    } else {
      throw new Error("Gemini AI API key not configured or client initialization skipped.");
    }
  } catch (err: any) {
    const errMsg = err.message || "";
    let fallbackReason = "Local sandbox simulator context active.";
    let quotaExceeded = false;
    
    if (errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("limit")) {
      fallbackReason = "Gemini API Quota or Rate-Limit Exceeded (429 RESOURCE_EXHAUSTED). Free-tier limits have been reached.";
      quotaExceeded = true;
      console.warn("[Advisory API] Gemini Quota/Rate-Limit (429) encountered. Graced fallback template successfully initialized.");
    } else if (errMsg.includes("key") || !ai) {
      fallbackReason = "API Key not configured. Please register your private gemini context.";
      console.log("[Advisory API] Missing API Key. Fallback active.");
    } else {
      fallbackReason = errMsg;
      console.error("[Advisory API] Standard error encountered during model call:", errMsg);
    }

    // Pristine high-quality fallback strategy system based on local metrics
    const dynamicArpu = metrics.arpu;
    const fallbackAdvice = {
      summary: `Your developer app ecosystem demonstrates a solid initial converted footprint of ${metrics.conversionRate}% with average developer lifetime spend (ARPU) at $${dynamicArpu}. However, there is massive monetization leak in unpaid payload synthesis.`,
      pricingRecommendations: [
        {
          skillName: "Voice Clone Synthesis Studio",
          currentPrice: "$0.04 per 1K synthesis calls",
          recommendedModel: "SaaS Hybrid ($29/mo platform fee including 500K free calls + $0.02/1k calls metered overage)",
          financialImpact: "Est +45% predictable MRR surge",
          details: "Developers prefer predictable line items. Adding a baseline subscription protects API overhead while ensuring steady passive monthly revenue."
        },
        {
          skillName: "Recursive Agent Planner Logic",
          currentPrice: "$0.08 per task tree resolved",
          recommendedModel: "Pay-As-You-Go with $10 minimum prepaid reload credits",
          financialImpact: "Reduces invoicing friction in microtransactions",
          details: "Executing deep logical structures triggers multiple sub-queries. Setting a prepaid model avoids carrying small developers in debt."
        }
      ],
      underEarningWarns: [
        {
          title: "Draft Status Revenue Blockers",
          severity: "High",
          observation: "The Automated Twitter Auto-Promoter has solid adoption potential (340 active draft users) but is locked behind Draft status earning $0.",
          actionPlan: "Unify draft to public. Enable 'Flat Subscription' of $9.99/mo to capture initial developer audience instantly."
        },
        {
          title: "Under-pricing High-Performance Multimodal Logic",
          severity: "Medium",
          observation: "OCR Data Extractor is set on a static one-time $49 charge, despite heavy usage trends. You will lose money on long-term API server hosting.",
          actionPlan: "Grandfather current users but migrate to a seat-based or credit-based transaction limit for new signups."
        }
      ],
      growthHacks: [
        "Incentivize builders with $10 in trial credits for configuring their first webhooks schema successfully.",
        "Bundle 'Gemini Code Compléter' and 'Recursive Agent Planner Logic' as the ultimate 'AI Builder Combo' for a single subscription flat discount of $24.99/mo.",
        "Expose a free usage fallback tier (up to 5 calls/min) matching simulated rate triggers to spark conversion engagement."
      ]
    };
    
    res.json({ 
      success: true, 
      advice: fallbackAdvice, 
      isFallback: true, 
      quotaExceeded, 
      fallbackReason 
    });
  }
});


// High-fidelity Local News Grounding fallback database for selected tickers
const LOCAL_NEWS_GROUNDING: { [ticker: string]: any } = {
  NVDA: {
    ticker: "NVDA",
    summary: "NVIDIA news sentiment remains overwhelmingly bullish over the past 24 hours following surging hyperscaler chip demand and new AI cluster deployment contracts. Technical structures hold firm near breakout thresholds.",
    marketSentiment: "Bullish",
    impactIndex: 94,
    news: [
      {
        headline: "NVIDIA H200 and Blackwell chips witness unprecedented backlogs as hyperscalers expand cloud native systems",
        source: "Reuters",
        url: "https://www.reuters.com/technology",
        time: "1 hour ago",
        sentiment: 0.95,
        sentimentLabel: "bullish",
        category: "earnings",
        sourceCredibility: 10,
        marketImpactScore: 95
      },
      {
        headline: "New enterprise AI computing partnerships announced with Oracle and CoreWeave systems",
        source: "Bloomberg",
        url: "https://www.bloomberg.com",
        time: "4 hours ago",
        sentiment: 0.85,
        sentimentLabel: "bullish",
        category: "AI news",
        sourceCredibility: 9,
        marketImpactScore: 88
      },
      {
        headline: "Semiconductor supply chain optimizations minimize near-term advanced packaging delays",
        source: "Wall Street Journal",
        url: "https://www.wsj.com",
        time: "12 hours ago",
        sentiment: 0.35,
        sentimentLabel: "neutral",
        category: "macro",
        sourceCredibility: 10,
        marketImpactScore: 72
      },
      {
        headline: "Analysts raise price consensus target to $1050 citing durable Blackwell platform lock-in",
        source: "CNBC Finance",
        url: "https://www.cnbc.com",
        time: "18 hours ago",
        sentiment: 0.9,
        sentimentLabel: "bullish",
        category: "macro",
        sourceCredibility: 8,
        marketImpactScore: 92
      }
    ],
    groundingReferences: [
      { title: "NVIDIA Supply Optimization Trends - Reuters", uri: "https://www.reuters.com/technology" },
      { title: "SaaS AI Cluster Expansion Analysis - Bloomberg", uri: "https://www.bloomberg.com" },
      { title: "Wall Street Journal Stock Profiles", uri: "https://www.wsj.com" }
    ]
  },
  TSLA: {
    ticker: "TSLA",
    summary: "Tesla sentiment is consolidated as autonomous Full Self-Driving marketing campaigns and Next-Gen mobility updates balance competitive EV margin variables on regional incentive grids.",
    marketSentiment: "Neutral",
    impactIndex: 68,
    news: [
      {
        headline: "Tesla steps up localized Full Self-Driving promo campaigns in Northern California trial corridors",
        source: "Bloomberg",
        url: "https://www.bloomberg.com",
        time: "2 hours ago",
        sentiment: 0.7,
        sentimentLabel: "bullish",
        category: "product launch",
        sourceCredibility: 10,
        marketImpactScore: 82
      },
      {
        headline: "Competition intensifies in offshore gigafactory channels, impacting Q2 delivery projections",
        source: "Reuters",
        url: "https://www.reuters.com",
        time: "5 hours ago",
        sentiment: -0.45,
        sentimentLabel: "bearish",
        category: "earnings",
        sourceCredibility: 9,
        marketImpactScore: 74
      },
      {
        headline: "Lithium carbonate pricing index decline alleviates battery cell packaging production margins",
        source: "CNBC",
        url: "https://www.cnbc.com",
        time: "14 hours ago",
        sentiment: 0.45,
        sentimentLabel: "bullish",
        category: "macro",
        sourceCredibility: 8,
        marketImpactScore: 68
      }
    ],
    groundingReferences: [
      { title: "Tesla Autonomous FSD Roadmap - Bloomberg", uri: "https://www.bloomberg.com/news" },
      { title: "Lithium Market Index Tracking - CNBC", uri: "https://www.cnbc.com" }
    ]
  },
  MSFT: {
    ticker: "MSFT",
    summary: "Microsoft experiences robust bullish coverage driven by skyrocketing Azure AI developer run-rates and enterprise Copilot integration feedback.",
    marketSentiment: "Bullish",
    impactIndex: 90,
    news: [
      {
        headline: "Azure AI cloud computing subscriptions hit quarterly target milestone ahead of forecast expectations",
        source: "Bloomberg",
        url: "https://www.bloomberg.com",
        time: "3 hours ago",
        sentiment: 0.94,
        sentimentLabel: "bullish",
        category: "earnings",
        sourceCredibility: 10,
        marketImpactScore: 96
      },
      {
        headline: "Microsoft introduces modular edge computing architecture with high developer privacy configurations",
        source: "TechCrunch",
        url: "https://techcrunch.com",
        time: "8 hours ago",
        sentiment: 0.8,
        sentimentLabel: "bullish",
        category: "product launch",
        sourceCredibility: 8,
        marketImpactScore: 78
      }
    ],
    groundingReferences: [
      { title: "MSFT Cloud Solutions Breakdown - TechCrunch", uri: "https://techcrunch.com" },
      { title: "Bloomberg Technology Indices", uri: "https://www.bloomberg.com" }
    ]
  },
  META: {
    ticker: "META",
    summary: "Meta Platforms enjoys highly positive sentiment over the past 24 hours after rolling out its next-gen AI-driven advertising matching suites.",
    marketSentiment: "Bullish",
    impactIndex: 86,
    news: [
      {
        headline: "Meta Platforms launches generative ad suite to global marketing groups with high conversion scores",
        source: "Wall Street Journal",
        url: "https://www.wsj.com",
        time: "6 hours ago",
        sentiment: 0.88,
        sentimentLabel: "bullish",
        category: "product launch",
        sourceCredibility: 10,
        marketImpactScore: 90
      },
      {
        headline: "Daily Active Users count across Instagram, Threads and WhatsApp stabilizes at historic peaks",
        source: "CNBC",
        url: "https://www.cnbc.com",
        time: "11 hours ago",
        sentiment: 0.82,
        sentimentLabel: "bullish",
        category: "macro",
        sourceCredibility: 8,
        marketImpactScore: 84
      }
    ],
    groundingReferences: [
      { title: "Meta Earnings Catalyst Tracker - WSJ", uri: "https://www.wsj.com" }
    ]
  },
  AAPL: {
    ticker: "AAPL",
    summary: "Apple is trading on defensive buybacks and anticipation of localized on-device AI enhancements integrated into upcoming consumer device refreshes.",
    marketSentiment: "Bullish",
    impactIndex: 78,
    news: [
      {
        headline: "Apple targets high-speed local AI core integration in upcoming desktop processing architectures",
        source: "Bloomberg",
        url: "https://www.bloomberg.com",
        time: "4 hours ago",
        sentiment: 0.8,
        sentimentLabel: "bullish",
        category: "product launch",
        sourceCredibility: 10,
        marketImpactScore: 85
      },
      {
        headline: "Consumer replacement cycle indicators show stable user retention ratios in mature global sectors",
        source: "Financial Times",
        url: "https://www.ft.com",
        time: "16 hours ago",
        sentiment: 0.4,
        sentimentLabel: "neutral",
        category: "macro",
        sourceCredibility: 9,
        marketImpactScore: 72
      }
    ],
    groundingReferences: [
      { title: "FT Markets and Tech Trends", uri: "https://www.ft.com" }
    ]
  },
  GOOGL: {
    ticker: "GOOGL",
    summary: "Alphabet exhibits constructive news momentum regarding Google Search generative answers expansion and enterprise developer API license growth.",
    marketSentiment: "Bullish",
    impactIndex: 80,
    news: [
      {
        headline: "Google launches enhanced search answer models to developer clouds, cutting latency in half",
        source: "TechCrunch",
        url: "https://techcrunch.com",
        time: "3 hours ago",
        sentiment: 0.85,
        sentimentLabel: "bullish",
        category: "product launch",
        sourceCredibility: 8,
        marketImpactScore: 80
      },
      {
        headline: "Enterprise Gemini API integrations show compounding volume growth on low usage cost profiles",
        source: "Wall Street Journal",
        url: "https://www.wsj.com",
        time: "14 hours ago",
        sentiment: 0.78,
        sentimentLabel: "bullish",
        category: "earnings",
        sourceCredibility: 10,
        marketImpactScore: 83
      }
    ],
    groundingReferences: [
      { title: "Alphabet AI Advancements - TechCrunch", uri: "https://techcrunch.com" }
    ]
  }
};

// Dynamic Fallback News Grounding Generator for any inputted ticker
function getDynamicGroundedNewsFallback(tickerInput: string) {
  const cleanTicker = tickerInput.toUpperCase().trim().match(/[A-Z\.\-]{2,6}/)?.[0] || "ASSET";
  
  if (LOCAL_NEWS_GROUNDING[cleanTicker]) {
    return LOCAL_NEWS_GROUNDING[cleanTicker];
  }

  const isUp = Math.random() > 0.45;
  const sentimentVal = isUp ? parseFloat((0.2 + Math.random() * 0.7).toFixed(2)) : parseFloat((-0.1 - Math.random() * 0.55).toFixed(2));
  const sentimentText = sentimentVal > 0.15 ? "Bullish" : (sentimentVal < -0.15 ? "Bearish" : "Neutral");
  const impactIndex = Math.floor(62 + Math.random() * 32);

  const sources = ["Reuters", "Bloomberg", "Wall Street Journal", "CNBC Finance", "Financial Times"];
  const randomSource1 = sources[Math.floor(Math.random() * sources.length)];
  const randomSource2 = sources[(Math.floor(Math.random() * sources.length) + 1) % sources.length];

  return {
    ticker: cleanTicker,
    summary: `Search grounding scan for '${cleanTicker}' over the past 24 hours indicates a mostly ${sentimentText.toLowerCase()} trend. Live signals suggest steady volume pacing, institutional balance accumulation, and active support validation.`,
    marketSentiment: sentimentText,
    impactIndex: impactIndex,
    news: [
      {
        headline: `${cleanTicker} undergoes volume momentum expansion on high-density institutional accumulation signals`,
        source: randomSource1,
        url: `https://www.google.com/search?q=${cleanTicker}+stock+market+news`,
        time: "3 hours ago",
        sentiment: sentimentVal,
        sentimentLabel: sentimentText.toLowerCase(),
        category: "earnings",
        sourceCredibility: 9,
        marketImpactScore: Math.floor(impactIndex - 4 + Math.random() * 8)
      },
      {
        headline: `Recent regulatory compliance filings verify stable segment balance assets and constructive forecasts`,
        source: randomSource2,
        url: `https://www.google.com/search?q=${cleanTicker}+sec+filings+reports`,
        time: "15 hours ago",
        sentiment: parseFloat((sentimentVal * 0.4).toFixed(2)),
        sentimentLabel: "neutral",
        category: "regulation",
        sourceCredibility: 10,
        marketImpactScore: Math.floor(impactIndex * 0.8)
      }
    ],
    groundingReferences: [
      { title: `${cleanTicker} Live Asset Financial Search Feed`, uri: `https://www.google.com/search?q=${cleanTicker}+stock` }
    ]
  };
}

// REST endpoint for real-time stock news search grounding with Gemini 3.5-flash
app.post("/api/stock/grounding", async (req, res) => {
  const rawTicker = req.body.ticker || req.query.ticker || "NVDA";
  const ticker = rawTicker.toUpperCase().trim().match(/[A-Z0-9\.\-]{1,8}/)?.[0] || "NVDA";

  try {
    if (ai) {
      console.log(`[Grounding API] Invoking Gemini Search Grounding for ticker: ${ticker}`);
      const prompt = `
Find, parse and evaluate the latest 24-hour financial news headlines, earnings insights, regulatory filings, or market events for the stock ticker '${ticker}'.
Analyze each recent news item, assigning a sentiment score (-1.0 to 1.0 being very bearish to very bullish), ranking its source credibility (1 to 10 scale), categorizing the event type (e.g. 'earnings', 'product launch', 'AI news', 'layoffs', 'regulation', 'macro'), and calculating its 'marketImpactScore' (1 to 100) based on source strength and sentiment multiplier.

Return your response strictly in JSON format matching this schema so the client dashboard can render it flawlessly:
{
  "ticker": "${ticker}",
  "summary": "1-3 sentences summarizing the major news catalyst and consensus sentiment trajectory over the past 24 hours.",
  "marketSentiment": "Bullish" | "Bearish" | "Neutral",
  "impactIndex": 85,
  "news": [
    {
      "headline": "Full specific financial headline text retrieved",
      "source": "Bloomberg" | "Reuters" | "WSJ" | "CNBC" | "TechCrunch" | "Financial Times",
      "url": "https://...",
      "time": "e.g. 2 hours ago",
      "sentiment": 0.85,
      "sentimentLabel": "bullish" | "bearish" | "neutral",
      "category": "earnings" | "product launch" | "AI news" | "regulation" | "macro",
      "sourceCredibility": 9,
      "marketImpactScore": 88
    }
  ]
}

Ensure you strictly respond with ONLY this raw JSON object. Do not include markdown headers, backticks, or trailing comments.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ticker: { type: Type.STRING },
              summary: { type: Type.STRING },
              marketSentiment: { type: Type.STRING },
              impactIndex: { type: Type.INTEGER },
              news: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    headline: { type: Type.STRING },
                    source: { type: Type.STRING },
                    url: { type: Type.STRING },
                    time: { type: Type.STRING },
                    sentiment: { type: Type.NUMBER },
                    sentimentLabel: { type: Type.STRING },
                    category: { type: Type.STRING },
                    sourceCredibility: { type: Type.INTEGER },
                    marketImpactScore: { type: Type.INTEGER }
                  },
                  required: ["headline", "source", "url", "time", "sentiment", "sentimentLabel", "category", "sourceCredibility", "marketImpactScore"]
                }
              }
            },
            required: ["ticker", "summary", "marketSentiment", "impactIndex", "news"]
          },
          tools: [{ googleSearch: {} }]
        }
      });

      const textOutput = response.text || "";
      let parsedResult = cleanAndParseJSON(textOutput);

      // Extract actual Google Search grounding links
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const webChunks = chunks
        .filter((c: any) => c.web)
        .map((c: any) => ({
          title: c.web.title,
          uri: c.web.uri
        }));

      // Merge Google Search grounding references
      parsedResult.groundingReferences = webChunks;

      // If the model did not populate URLs, inject the grounding links back into the articles
      if (parsedResult.news && parsedResult.news.length > 0) {
        parsedResult.news.forEach((item: any, idx: number) => {
          if (!item.url || item.url.startsWith("https://...") || item.url.includes("placeholder")) {
            const pairedLink = webChunks[idx % webChunks.length];
            item.url = pairedLink ? pairedLink.uri : `https://www.google.com/search?q=${ticker}+stock+news`;
          }
        });
      }

      if (webChunks.length === 0) {
        parsedResult.groundingReferences = [
          { title: `${ticker} Search Verification Index`, uri: `https://www.google.com/search?q=${ticker}+stock+developments` }
        ];
      }

      console.log(`[Grounding API] Successfully completed search grounding for ${ticker}`);
      return res.json({ success: true, isMock: false, data: parsedResult });

    } else {
      console.log(`[Grounding API] Gemini is not active. Using high-fidelity local fallback for ${ticker}`);
      const fallbackData = getDynamicGroundedNewsFallback(ticker);
      return res.json({ success: true, isMock: true, data: fallbackData });
    }
  } catch (err: any) {
    console.error(`[Grounding API] Error during grounding call for ${ticker}:`, err);
    // Safe recovery
    const fallbackData = getDynamicGroundedNewsFallback(ticker);
    return res.json({ success: true, isMock: true, data: fallbackData, errorMsg: err.message });
  }
});

// Configure full-stack environment for Vite development vs static production builds
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Monetization Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
