/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: "Language" | "Audio" | "Vision" | "Utility";
  billingModel: "Pay-as-you-go" | "Flat Subscription" | "One-time Purchase";
  price: number; // e.g. $0.005 per token, or $19/mo, or $49 standard
  unit: string;  // e.g. "per 1K calls", "per month", "lifetime"
  activeUsers: number;
  salesCount: number;
  earnings: number;
  status: "Active" | "Draft" | "Review Required";
}

export interface MetricSummary {
  grossEarnings: number;
  mrr: number; // Monthly Recurring Revenue
  activeSubscriptions: number;
  conversionRate: number; // percentage of free users to paying users
  totalPurchases: number;
  arpu: number; // Average Revenue Per User
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  event: string;
  source: "Stripe" | "PayPal" | "Internal System";
  status: "Success" | "Failed" | "Pending";
  amount: number;
  details: string;
}

export interface IntegrationConfig {
  stripePublicKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  paypalClientId: string;
  paypalSecretKey: string;
  environment: "sandbox" | "live";
  autoPayoutEnabled: boolean;
  stripeConnectClientId?: string;
  connectWebhookSecret?: string;
  platformCommissionRate?: number;
}

export interface UserAccount {
  username: string;
  email: string;
  premium: boolean;
  purchased_skills: string[];
  totalSpent: number;
  stripeConnectId?: string;
  connectStatus?: "unlinked" | "pending" | "active";
  payoutsEnabled?: boolean;
}

export interface SkillPopularity {
  [skillId: string]: number;
}

export interface PaymentAnalytics {
  users: UserAccount[];
  skillPopularity: SkillPopularity;
}

export interface DashboardData {
  metrics: MetricSummary;
  skills: Skill[];
  logs: WebhookLog[];
  config: IntegrationConfig;
  simulationHistory: Array<{ date: string; revenue: number; apiCalls: number }>;
  users?: UserAccount[];
}
