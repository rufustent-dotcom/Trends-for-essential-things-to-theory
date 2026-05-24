/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Activity, 
  DollarSign, 
  TrendingUp, 
  Sparkles, 
  Cpu, 
  Layers, 
  Settings, 
  BookOpen, 
  Terminal, 
  ArrowUpRight, 
  Check, 
  Copy, 
  RefreshCw, 
  Sliders, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Info,
  ChevronRight,
  ExternalLink,
  Lock,
  Download,
  Clock,
  Database,
  Maximize,
  Users,
  Target,
  Network,
  MessageSquare,
  Briefcase,
  Bot,
  Building,
  Shield,
  Plus,
  Trash2,
  FileText,
  HelpCircle
} from "lucide-react";

import { codeTemplates } from "./utils/codeTemplates";
import { Skill, MetricSummary, WebhookLog, IntegrationConfig, DashboardData } from "./types";
import { PatternNode, SignalNode } from "./data/patternsMapData";
import PatternsSignalsMap from "./components/PatternsSignalsMap";
import RevenueForecast from "./components/RevenueForecast";
import EcosystemHeatmap from "./components/EcosystemHeatmap";
import StockAnalysisDemo from "./components/StockAnalysisDemo";
import SubscriptionGrowthChart from "./components/SubscriptionGrowthChart";

export default function App() {
  // Global App States from Backend Server
  const [metrics, setMetrics] = useState<MetricSummary>({
    grossEarnings: 14850.50,
    mrr: 2150.00,
    activeSubscriptions: 112,
    conversionRate: 6.8,
    totalPurchases: 540,
    arpu: 27.50
  });

  const [skills, setSkills] = useState<Skill[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [config, setConfig] = useState<IntegrationConfig>({
    stripePublicKey: "",
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    paypalClientId: "",
    paypalSecretKey: "",
    environment: "sandbox",
    autoPayoutEnabled: true
  });

  const [simulationHistory, setSimulationHistory] = useState<Array<{ date: string; revenue: number; apiCalls: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simType, setSimType] = useState<string>("purchase_subscription");
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");

  // Primary Workspace tab toggling
  const [activeTab, setActiveTab ] = useState<"map" | "sandbox" | "finances" | "payments" | "stock">("map");

  // User Management and Interactive simulated checkout states
  const [users, setUsers] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [checkoutUser, setCheckoutUser] = useState("");
  const [checkoutSkill, setCheckoutSkill] = useState("");
  const [checkoutProvider, setCheckoutProvider] = useState<"stripe" | "paypal">("stripe");
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [checkoutError, setCheckoutError] = useState("");
  const [copiedAnalyticsJson, setCopiedAnalyticsJson] = useState(false);

  // Selection states inside Patterns/Signals Map
  const [selectedMapNode, setSelectedMapNode] = useState<{ type: "pattern" | "signal"; data: any } | null>(null);
  const [strengthMetadata, setStrengthMetadata] = useState<{ [key: string]: number }>({});

  // Strategy Analysis & Gemini states
  const [adviceData, setAdviceData] = useState<any | null>(null);
  const [generatingAdvice, setGeneratingAdvice] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [customQueryPrompt, setCustomQueryPrompt] = useState("");
  const [isFallbackResult, setIsFallbackResult] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  // Checkboxes list audit values
  const [actionChecklist, setActionChecklist] = useState({
    connections: true,
    impact: false,
    systems: false,
    evaluate: false
  });

  // Credentials Config States
  const [stripePub, setStripePub] = useState("");
  const [stripeSec, setStripeSec] = useState("");
  const [stripeWeb, setStripeWeb] = useState("");
  const [paypalId, setPaypalId] = useState("");
  const [paypalSec, setPaypalSec] = useState("");
  const [envOption, setEnvOption] = useState<"sandbox" | "live">("sandbox");
  const [payoutOption, setPayoutOption] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [connectClientId, setConnectClientId] = useState("");
  const [connectWebhookSec, setConnectWebhookSec] = useState("");
  const [commissionRate, setCommissionRate] = useState(20);

  // Snippets States
  const [activeLanguage, setActiveLanguage] = useState<"nodejs" | "python">("nodejs");
  const [activeProvider, setActiveProvider] = useState<"stripe" | "paypal">("stripe");
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load Initial Data from Node Backend Server
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/data");
      const data: DashboardData = await res.json();
      setMetrics(data.metrics);
      setSkills(data.skills);
      setLogs(data.logs);
      setConfig(data.config);
      setSimulationHistory(data.simulationHistory);
      if (data.users) {
        setUsers(data.users);
      }
      
      // Inject settings seed
      setStripePub(data.config.stripePublicKey);
      setStripeSec(data.config.stripeSecretKey);
      setStripeWeb(data.config.stripeWebhookSecret);
      setPaypalId(data.config.paypalClientId);
      setPaypalSec(data.config.paypalSecretKey);
      setEnvOption(data.config.environment);
      setPayoutOption(data.config.autoPayoutEnabled);
      setConnectClientId(data.config.stripeConnectClientId || "");
      setConnectWebhookSec(data.config.connectWebhookSecret || "");
      setCommissionRate(data.config.platformCommissionRate || 20);

      if (data.skills.length > 0 && !selectedSkillId) {
        setSelectedSkillId(data.skills[0].id);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add a new test user to mock Stripe/PayPal billing cycles
  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    try {
      const res = await fetch("/api/payment/create_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, email: newUserEmail })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setNewUsername("");
        setNewUserEmail("");
      } else {
        alert(data.error || "Failed to create user");
      }
    } catch (err) {
      console.error("User creation failed:", err);
    }
  };

  // Stripe Connect sub-account payout input state
  const [connectPayoutAmounts, setConnectPayoutAmounts] = useState<{[username: string]: string}>({});

  const handleConnectLink = async (username: string) => {
    try {
      const res = await fetch("/api/connect/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setLogs(data.logs);
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error("Connect link failed:", err);
    }
  };

  const handleConnectToggleStatus = async (username: string, status: "active" | "unlinked") => {
    try {
      const res = await fetch("/api/connect/toggle_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, status })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setLogs(data.logs);
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error("Toggle Connect status failed:", err);
    }
  };

  const handleConnectPayout = async (username: string) => {
    const amountVal = connectPayoutAmounts[username] || "";
    const amountNum = parseFloat(amountVal);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid transfer amount greater than 0.");
      return;
    }

    try {
      const res = await fetch("/api/connect/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, amount: amountNum })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setLogs(data.logs);
        setConnectPayoutAmounts(prev => ({ ...prev, [username]: "" }));
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Split payout failed:", err);
    }
  };

  // Run a high-fidelity simulated checkout sequence
  const handlePurchaseSkill = async () => {
    if (!checkoutUser || !checkoutSkill) {
      setCheckoutError("Please select both a test user and an AI skill to purchase.");
      setCheckoutStatus("error");
      return;
    }

    setCheckoutStatus("processing");
    setCheckoutError("");

    try {
      const res = await fetch("/api/payment/purchase_skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: checkoutUser,
          skillId: checkoutSkill,
          provider: checkoutProvider
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setCheckoutStatus("success");
        setUsers(data.users);
        setMetrics(data.metrics);
        setSkills(data.skills);
        setLogs(data.logs);
        
        // Fetch to coordinate history lines nicely
        const subRes = await fetch("/api/dashboard/data");
        const subData = await subRes.json();
        if (subData.simulationHistory) {
          setSimulationHistory(subData.simulationHistory);
        }

        setTimeout(() => {
          setCheckoutStatus("idle");
          setCheckoutUser("");
          setCheckoutSkill("");
        }, 3200);
      } else {
        setCheckoutError(data.error || "Checkout failed");
        setCheckoutStatus("error");
      }
    } catch (err) {
      setCheckoutError("Connection timed out. Internal payment gateway did not acknowledge.");
      setCheckoutStatus("error");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update Config on Save (Express Endpoint)
  const saveConfiguration = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/dashboard/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stripePublicKey: stripePub,
          stripeSecretKey: stripeSec,
          stripeWebhookSecret: stripeWeb,
          paypalClientId: paypalId,
          paypalSecretKey: paypalSec,
          environment: envOption,
          autoPayoutEnabled: payoutOption,
          stripeConnectClientId: connectClientId,
          connectWebhookSecret: connectWebhookSec,
          platformCommissionRate: Number(commissionRate)
        })
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setLogs(data.logs);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to update config settings:", err);
    }
  };

  // Trigger simulated transactions webhooks instantly
  const triggerSimulation = async (type: string, skillId?: string) => {
    try {
      setSimulationRunning(true);
      const targetSkill = skillId || selectedSkillId;
      const res = await fetch("/api/dashboard/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, skillId: targetSkill })
      });
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setSkills(data.skills);
        setLogs(data.logs);
        setSimulationHistory(data.simulationHistory);
      }
    } catch (err) {
      console.error("Failed to play sandbox simulation event:", err);
    } finally {
      setSimulationRunning(false);
    }
  };

  // Export Webhook Logs to CSV for Audit Compliance
  const downloadWebhookLogsCSV = () => {
    if (!logs || logs.length === 0) return;
    
    const headers = ["ID", "Timestamp", "Event", "Source", "Status", "Amount", "Details"];
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      const clean = str.replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = logs.map(log => [
      escapeCSV(log.id),
      escapeCSV(log.timestamp),
      escapeCSV(log.event),
      escapeCSV(log.source),
      escapeCSV(log.status),
      escapeCSV(typeof log.amount === "number" ? log.amount.toFixed(2) : log.amount),
      escapeCSV(log.details)
    ]);
    
    const csvContent = [headers.map(h => `"${h}"`).join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `transaction_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export customized Connection matrix schema to CSV
  const downloadTopologyMatrixCSV = () => {
    const headers = ["Source Pattern ID", "Target Signal ID", "Strength index", "Status"];
    const rows = [
      ["p-1", "s-1", "Max Support", "Verified"],
      ["p-1", "s-5", "Medium", "Active"],
      ["p-1", "s-6", "High", "Active"],
      ["p-2", "s-1", "Max Support", "Verified"],
      ["p-2", "s-2", "Strong", "Active"],
      ["p-2", "s-6", "Weak", "Pending"],
      ["p-3", "s-3", "Max Support", "Verified"],
      ["p-3", "s-8", "Medium", "Active"],
      ["p-4", "s-5", "Strong", "Active"],
      ["p-5", "s-7", "Max Support", "Active"]
    ];

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `cause_signals_topology_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Trigger Gemini AI advisor for Selected Node Strategy
  const generateAdvisoryReport = async () => {
    try {
      setGeneratingAdvice(true);
      setAdviceError(null);
      setAdviceData(null);
      setIsFallbackResult(false);
      setQuotaExceeded(false);
      setFallbackReason(null);
 
      // Perform server API call with custom settings context to query Gemini AI
      const res = await fetch("/api/dashboard/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focusNodeId: selectedMapNode ? selectedMapNode.data.id : "all",
          nodeType: selectedMapNode ? selectedMapNode.type : "global",
          metadata: {
            strength: (selectedMapNode && selectedMapNode.type === "pattern") ? strengthMetadata[selectedMapNode.data.id] || 0 : 0,
            prompt: customQueryPrompt
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        // Enforce parsing or fallbacks nicely
        setAdviceData(data.advice);
        setIsFallbackResult(!!data.isFallback);
        setQuotaExceeded(!!data.quotaExceeded);
        setFallbackReason(data.fallbackReason || null);
      } else {
        throw new Error(data.error || "Failed to communicate with advisory engine.");
      }
    } catch (err: any) {
      console.warn("Express backend Gemini API error / Offline fallback advice triggered:", err.message);
      // Construct dynamic strategic context relative to selected node!
      const fallbackReport = {
        summary: selectedMapNode 
          ? `Strategic review optimized for [${selectedMapNode.data.name}]. This node anchors critical dependencies within your digital transaction model, generating a conversion support weight representation of ${selectedMapNode.type === 'pattern' ? (strengthMetadata[selectedMapNode.data.id] || 0) : 'High'}/8.`
          : `Executive review of the full AI Agent causality workspace. Current developer MRR ($${metrics.mrr}) is highly geared to Automation Platforms.`,
        pricingRecommendations: [
          {
            skillName: selectedMapNode ? selectedMapNode.data.name : "Voice Clone Synthesis Studio",
            currentPrice: selectedMapNode ? "Custom Tier" : "$0.04 per 1k calls",
            recommendedModel: "SaaS Hybrid Framework Setup — $29/mo threshold + metered API usage credits",
            financialImpact: "Est +38% predictable ARR surge",
            details: "Standardizing API overhead inside user subscriptions provides recurring cash flow protection while optimizing resource usage."
          }
        ],
        underEarningWarns: [
          {
            title: "Over-indexing on static hosting models",
            severity: "High",
            observation: "High-performance nodes are carrying heavy telemetry data without metered billing schemas.",
            actionPlan: "Unify draft to public. Require standard authentication keys to route requests securely."
          }
        ],
        growthHacks: [
          selectedMapNode && selectedMapNode.type === "pattern" 
            ? `Package "${selectedMapNode.data.name}" opportunities directly into trial credits worth $15 to stimulate client retention.`
            : "Bundle primary speech, reasoning, and visual OCR units for a flat developer combination license."
        ]
      };
      setAdviceData(fallbackReport);
      setIsFallbackResult(true);
      setQuotaExceeded(false);
      setFallbackReason("Local sandbox environment offline or disconnected.");
    } finally {
      setGeneratingAdvice(false);
    }
  };

  // Run initial strategy review on mount
  useEffect(() => {
    generateAdvisoryReport();
  }, [selectedMapNode]);

  const handleCopySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  // Calculate Action checklists checked count
  const actionChecklistCompletedCount = Object.values(actionChecklist).filter(Boolean).length;

  return (
    <div className="bg-[#090d16] text-slate-100 min-h-screen font-sans flex flex-col justify-between selection:bg-[#a855f7]/30 selection:text-white">
      
      {/* Dynamic Header banner displaying title, state and tab selection routes */}
      <header className="border-b border-slate-800/80 sticky top-0 bg-[#090d16]/90 backdrop-blur-md z-30 px-6 py-4.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-gradient-to-r from-[#a855f7] to-[#06b6d4] text-[10.5px] font-extrabold tracking-widest text-[#090d16] uppercase">
                Enterprise Dashboard
              </span>
              <span className="text-slate-500 font-mono text-[10px] hidden sm:inline-block">
                v2.4.1 compliance
              </span>
            </div>
            
            <h1 className="text-xl font-headline font-black tracking-tight text-white flex items-center gap-2">
              <span>Developer Monetization Portals</span>
              <span className="text-slate-500 font-thin">|</span>
              <span className="text-slate-350 text-sm font-semibold tracking-wide font-sans">
                {activeTab === 'map' ? "Patterns & Signals causality map" : activeTab === 'sandbox' ? "API Sandbox Console" : activeTab === 'finances' ? "Revenue Analytics" : activeTab === 'payments' ? "Premium Skill Analytics & Payment Integration" : "Manus Stock Analysis Skill Demonstration"}
              </span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Main view triggers buttons */}
            <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
              <button
                onClick={() => setActiveTab("map")}
                className={`px-3.5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'map' ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#a855f7]" />
                <span>Patterns-Signals Map</span>
              </button>

              <button
                onClick={() => setActiveTab("sandbox")}
                className={`px-3.5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'sandbox' ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>API Sandbox</span>
              </button>

              <button
                onClick={() => setActiveTab("finances")}
                className={`px-3.5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'finances' ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#06b6d4]" />
                <span>Revenue Index</span>
              </button>

              <button
                onClick={() => setActiveTab("payments")}
                className={`px-3.5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'payments' ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Premium Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab("stock")}
                className={`px-3.5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'stock' ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <span>Stock Analysis</span>
              </button>
            </div>

            {/* Audit Logs Exporter button */}
            <button
              onClick={downloadWebhookLogsCSV}
              disabled={loading || logs.length === 0}
              className={`bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer ${
                logs.length === 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
              id="header-btn-download-csv"
              title="Export webhook logs for security audit"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Audit logs CSV</span>
            </button>
          </div>

        </div>
      </header>

      {/* Primary Content Grid */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex-1 space-y-8 z-10">

        <AnimatePresence mode="wait">
          
          {/* TAB 1: Flagship Patterns & Signals Map visual screen */}
          {activeTab === "map" && (
            <motion.div
              key="map-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              
              {/* TOP HUD ROW matching layout exactly */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="map-instructions-hud">
                
                {/* HUD Box Left: How to Read */}
                <div className="lg:col-span-4 bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-[#a855f7]">
                    <BookOpen className="w-4 h-4" />
                    <h4 className="text-xs font-extrabold tracking-wider uppercase font-mono">How To Read This Map</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Each colored line shows how a core pattern is expressed in real-world signals. Multiple connections mean the pattern is reinforced across multiple areas.
                  </p>
                </div>

                {/* HUD Box Center: Title and connection legends */}
                <div className="lg:col-span-4 bg-slate-950/90 border border-slate-800/90 p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                  <div className="space-y-0.5">
                    <h2 className="text-xl font-black tracking-tight text-white uppercase font-headline">Patterns ↔ Signals Map</h2>
                    <p className="text-[10px] text-cyan-400 tracking-wider font-mono uppercase">A living system of cause, impact, and opportunity</p>
                  </div>

                  {/* Legends rows */}
                  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 pt-1.5 text-[10px] font-mono text-slate-400 border-t border-slate-800 w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-bold">STRENGTH:</span>
                      <span className="w-4 h-0.5 bg-slate-100 block"></span>
                      <span>Strong</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-0.5 border-t border-dashed border-slate-500 block"></span>
                      <span>Emerging</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-bold ml-1">IMPACT:</span>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                        <span>High</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full inline-block"></span>
                        <span>Med</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block"></span>
                        <span>Low</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* HUD Box Right: Strategic insight summary */}
                <div className="lg:col-span-4 bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    <h4 className="text-xs font-extrabold tracking-wider uppercase font-mono">Insight & Compliance</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    When multiple high-impact signals reinforce a pattern, that pattern becomes a strategic lever for execution and advantage. Check tasks dynamically below.
                  </p>
                </div>

              </div>

              {/* Central interactive Map Column visualizer */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Left side: Grid Map node list */}
                <div className="xl:col-span-8 space-y-6">
                  <PatternsSignalsMap 
                    onSelectedNodeChange={(node) => setSelectedMapNode(node)}
                    onMetricsUpdate={(strength) => setStrengthMetadata(strength)}
                    stripeLogs={logs}
                  />
                </div>

                {/* Right side: Dynamic Gemini AI & Strategy Analyzer Panel */}
                <div className="xl:col-span-4 space-y-6">
                  
                  {/* Strategic Advisor Panel header */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 space-y-5 shadow-xl">
                    <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block animate-pulse"></span>
                          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Gemini Advisory Server</span>
                        </div>
                        <h3 className="font-extrabold text-slate-100 text-sm tracking-tight uppercase">Active Strategy Analyzer</h3>
                      </div>
                      
                      <button
                        onClick={generateAdvisoryReport}
                        disabled={generatingAdvice}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="Force recalculate advisory metrics"
                      >
                        <RefreshCw className={`w-4 h-4 ${generatingAdvice ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {/* Node Selector Display */}
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Focus Node Selected</span>
                        <div className="font-bold text-slate-200">
                          {selectedMapNode ? selectedMapNode.data.name : "Global Analysis Layout"}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                        selectedMapNode 
                          ? selectedMapNode.type === 'pattern' 
                            ? 'bg-purple-950 text-purple-300 border border-purple-800' 
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {selectedMapNode ? selectedMapNode.type.toUpperCase() : "ENTIRE MAP"}
                      </span>
                    </div>

                    {/* Quick interactive parameters inputs to modify advice context */}
                    <div className="space-y-2">
                      <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Custom Focus Query</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={customQueryPrompt}
                          onChange={(e) => setCustomQueryPrompt(e.target.value)}
                          placeholder="e.g. recommend pricing for Voice Cloning..."
                          className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 pr-10"
                        />
                        <button
                          onClick={generateAdvisoryReport}
                          disabled={generatingAdvice}
                          className="absolute right-1 top-1 bottom-1 px-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-lg text-cyan-400 text-xs font-bold transition cursor-pointer"
                        >
                          Send
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      {generatingAdvice ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs font-mono">
                          <span className="w-8 h-8 rounded-full border-2 border-t-emerald-500 border-slate-800 animate-spin"></span>
                          <span>Synthesizing Strategy Graph...</span>
                        </div>
                      ) : adviceError ? (
                        <div className="p-4 bg-red-950/40 border border-red-800/85 rounded-xl text-xs text-red-300 space-y-1">
                          <div className="font-bold">Recommendation Failure</div>
                          <p>{adviceError}</p>
                        </div>
                      ) : adviceData ? (
                        <div className="space-y-4 text-xs">
                          {/* Fallback & Quota Alert Banner */}
                          {isFallbackResult && (
                            <div className={`p-3 border rounded-xl flex items-start gap-2.5 ${
                              quotaExceeded 
                                ? 'bg-amber-950/20 border-amber-800/40 text-amber-300' 
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}>
                              <span className="text-xs shrink-0 mt-0.5">{quotaExceeded ? "⚠️" : "💡"}</span>
                              <div className="space-y-0.5">
                                <div className="font-extrabold uppercase font-mono tracking-wider text-[9px] text-[#cbd5e1]">
                                  {quotaExceeded ? "Gemini API Quota Reached (429)" : "Localized Model Active"}
                                </div>
                                <p className="text-slate-400 text-xxs font-sans leading-relaxed">
                                  {fallbackReason || "High-fidelity local strategy simulator is currently active."}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Executive Summary */}
                          <div className="space-y-1.5 p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-xl">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Executive Summary</span>
                            <p className="text-slate-300 text-xxs font-medium leading-relaxed font-sans">{adviceData.summary}</p>
                          </div>

                          {/* Pricing Proposal */}
                          <div className="space-y-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Pricing & Packaging Recommended</span>
                            {adviceData.pricingRecommendations?.map((rec: any, idx: number) => (
                              <div key={idx} className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl space-y-1">
                                <div className="flex items-center justify-between text-xxs">
                                  <span className="font-bold text-slate-100">{rec.skillName}</span>
                                  <span className="text-cyan-400 font-bold">{rec.financialImpact}</span>
                                </div>
                                <div className="text-[10.5px] text-slate-400 font-mono">
                                  {rec.recommendedModel}
                                </div>
                                <p className="text-[10px] text-slate-400 leading-normal">{rec.details}</p>
                              </div>
                            ))}
                          </div>

                          {/* Action hazard alerts */}
                          {adviceData.underEarningWarns && adviceData.underEarningWarns.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Under-Earning Leak Alert</span>
                              {adviceData.underEarningWarns.map((w: any, idx: number) => (
                                <div key={idx} className="p-3 rounded-xl border border-amber-800/40 bg-amber-950/10 space-y-1">
                                  <div className="flex items-center justify-between gap-1 text-xxs font-bold text-amber-400">
                                    <span>⚠️ {w.title}</span>
                                    <span className="font-mono bg-amber-950 border border-amber-800 px-1.5 py-0.2 rounded uppercase tracking-wider">{w.severity} SEVERITY</span>
                                  </div>
                                  <p className="text-[10.5px] text-slate-300 font-sans">{w.observation}</p>
                                  <div className="text-[10px] text-slate-400 font-medium">
                                    <span className="text-slate-500 font-bold">Plan:</span> {w.actionPlan}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Strategy Hacks Checklist */}
                          <div className="space-y-2.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Tactical Growth Playbooks</span>
                            <ul className="space-y-1.5 text-xxs text-slate-300">
                              {adviceData.growthHacks?.map((hack: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-emerald-400 shrink-0 font-bold">✓</span>
                                  <span>{hack}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                        </div>
                      ) : null}
                    </div>

                  </div>

                </div>

              </div>

              {/* THREE BOTTOM HUD BLOCKS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="map-bottom-matrices">
                
                {/* HUD BLOCK 1: Dynamic Strength summary horizontal bars */}
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                    <h3 className="text-xs font-black tracking-widest text-slate-300 uppercase font-mono">Pattern Strength Summary</h3>
                    <span className="text-[10px] text-slate-500 font-mono">Based on Signal Support</span>
                  </div>

                  <div className="space-y-3 font-sans text-xs">
                    {[
                      { id: "p-1", name: "Automation Replaces Repetition", color: "#a855f7" },
                      { id: "p-2", name: "AI Compresses Time", color: "#3b82f6" },
                      { id: "p-3", name: "Information Becomes Infrastructure", color: "#10b981" },
                      { id: "p-4", name: "Systems Scale Better Than Manual Effort", color: "#f59e0b" },
                      { id: "p-5", name: "Leverage Multiplies Output", color: "#ef4444" },
                      { id: "p-6", name: "Clarity Creates Momentum", color: "#14b8a6" },
                      { id: "p-7", name: "Adaptation Compounds Advantage", color: "#ec4899" }
                    ].map((item) => {
                      // Get strength index dynamically, default to preset fallback values to maintain high accuracy matching!
                      const strengthCount = strengthMetadata[item.id] !== undefined 
                        ? strengthMetadata[item.id] 
                        : (item.id === 'p-1' ? 7 : item.id === 'p-2' ? 8 : item.id === 'p-3' ? 6 : item.id === 'p-4' ? 7 : item.id === 'p-5' ? 6 : item.id === 'p-6' ? 6 : 5);
                      
                      const percent = (strengthCount / 8) * 100;

                      return (
                        <div key={item.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xxs font-medium text-slate-350">
                            <span>{item.name}</span>
                            <span className="font-mono font-bold text-slate-100">{strengthCount}/8</span>
                          </div>
                          
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              className="h-full rounded-full transition-all duration-500"
                              style={{ backgroundColor: item.color }}
                            ></motion.div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* HUD BLOCK 2: Key Takeaway Box */}
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <HelpCircle className="w-4.5 h-4.5" />
                      <h3 className="text-xs font-black tracking-widest uppercase font-mono">Key Takeaway</h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                      Patterns that are reinforced by multiple high-impact signals represent the strongest opportunities for building leverage and long-term advantage.
                    </p>
                  </div>

                  <div className="p-3 bg-cyan-950/20 border border-cyan-900/40 rounded-xl space-y-2 text-xxs text-slate-300">
                    <div className="font-bold text-cyan-400">Compliance & Audit Ledger:</div>
                    <p className="font-medium">Downloading the connection topology matrix enables external strategy verification for corporate board audits.</p>
                    
                    <button
                      onClick={downloadTopologyMatrixCSV}
                      className="w-full mt-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg py-2 font-bold tracking-wide transition cursor-pointer text-center text-[10px]"
                    >
                      Export Connections Matrix CSV
                    </button>
                  </div>
                </div>

                {/* HUD BLOCK 3: How to Use visual Checkbox Audit Panel */}
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                    <h3 className="text-xs font-black tracking-widest text-slate-300 uppercase font-mono">How To Use This Map</h3>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      {actionChecklistCompletedCount}/4 Tasks Finished
                    </span>
                  </div>

                  <div className="space-y-3 text-xs font-sans">
                    <p className="text-slate-400 text-xxs">Verify compliance checkpoints dynamically by checking them below:</p>
                    
                    <div className="space-y-3">
                      <label className="flex items-start gap-2.5 p-2 rounded bg-slate-900/30 hover:bg-slate-900/50 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={actionChecklist.connections}
                          onChange={(e) => setActionChecklist({...actionChecklist, connections: e.target.checked})}
                          className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-950 text-[#a855f7] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-slate-300 font-medium">Identify the strongest pattern-signal connections.</span>
                      </label>

                      <label className="flex items-start gap-2.5 p-2 rounded bg-slate-900/30 hover:bg-slate-900/50 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={actionChecklist.impact}
                          onChange={(e) => setActionChecklist({...actionChecklist, impact: e.target.checked})}
                          className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-950 text-[#a855f7] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-slate-300 font-medium">Focus on high-impact signals reinforcing key patterns.</span>
                      </label>

                      <label className="flex items-start gap-2.5 p-2 rounded bg-slate-900/30 hover:bg-slate-900/50 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={actionChecklist.systems}
                          onChange={(e) => setActionChecklist({...actionChecklist, systems: e.target.checked})}
                          className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-950 text-[#a855f7] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-slate-300 font-medium">Build systems, content, or products that leverage these patterns.</span>
                      </label>

                      <label className="flex items-start gap-2.5 p-2 rounded bg-slate-900/30 hover:bg-slate-900/50 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={actionChecklist.evaluate}
                          onChange={(e) => setActionChecklist({...actionChecklist, evaluate: e.target.checked})}
                          className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-950 text-[#a855f7] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-slate-300 font-medium">Re-evaluate regularly as new signals emerge.</span>
                      </label>
                    </div>

                    <div className="pt-2">
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                          style={{ width: `${(actionChecklistCompletedCount / 4) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 2: Integration Webhook simulation & Sandbox Console */}
          {activeTab === "sandbox" && (
            <motion.div
              key="sandbox-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              
              {/* Alert Warning for sandbox mode */}
              <div className="bg-amber-950/20 border border-amber-900/50 p-4.5 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs text-amber-200">
                  <div className="font-bold">Developer Sandbox Mode Active</div>
                  <p>In sandbox environment (credentials mapped privately). Use general payment simulators below to trigger live webhooks, which automatically save inside the logs database ledger.</p>
                </div>
              </div>

              {/* Main content split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Credentials configurations & Simulator (Left) */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Playgrounds Simulators block */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-black tracking-widest text-slate-300 uppercase font-mono flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-amber-500" />
                      <span>Checkout Event Simulators</span>
                    </h3>

                    <div className="space-y-3.5 text-xs">
                      <div className="space-y-1">
                        <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Target Agent Skill</label>
                        <select
                          value={selectedSkillId}
                          onChange={(e) => setSelectedSkillId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl font-medium text-slate-100 focus:outline-none"
                        >
                          {skills.map((s) => (
                            <option key={s.id} value={s.id}>{s.name} ({s.billingModel})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Event Type trigger</label>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-900 transition cursor-pointer">
                            <input 
                              type="radio" 
                              name="sim-option" 
                              checked={simType === "purchase_subscription"}
                              onChange={() => setSimType("purchase_subscription")}
                              className="text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                            <span>subscription.created</span>
                          </label>

                          <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-900 transition cursor-pointer">
                            <input 
                              type="radio" 
                              name="sim-option" 
                              checked={simType === "pay_as_you_go_topup"}
                              onChange={() => setSimType("pay_as_you_go_topup")}
                              className="text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                            <span>payment_intent.succeeded (topup)</span>
                          </label>

                          <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-900 transition cursor-pointer">
                            <input 
                              type="radio" 
                              name="sim-option" 
                              checked={simType === "one_time_license"}
                              onChange={() => setSimType("one_time_license")}
                              className="text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                            <span>charge.succeeded (license)</span>
                          </label>

                          <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-900 transition cursor-pointer">
                            <input 
                              type="radio" 
                              name="sim-option" 
                              checked={simType === "failed_payout"}
                              onChange={() => setSimType("failed_payout")}
                              className="text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                            <span>charge.failed (declined)</span>
                          </label>
                        </div>
                      </div>

                      <button
                        onClick={() => triggerSimulation(simType)}
                        disabled={simulationRunning || skills.length === 0}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer mt-1 font-mono text-xxxs uppercase tracking-wide"
                      >
                        {simulationRunning ? (
                          <>
                            <span className="w-3.5 h-3.5 border border-slate-900 border-t-transparent animate-spin rounded-full"></span>
                            <span>PROVISIONING PAYLOAD GATEWAY...</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-4 h-4" />
                            <span>TRIGGER SIMULATED WEBHOOK EVENT</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Credentials Mappings Settings block */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-black tracking-widest text-slate-300 uppercase font-mono flex items-center gap-2">
                      <Settings className="w-4 h-4 text-emerald-400" />
                      <span>Security credentials map</span>
                    </h3>

                    <form onSubmit={saveConfiguration} className="space-y-4 text-xs font-sans">
                      <div className="space-y-1">
                        <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Stripe Public Key</label>
                        <input
                          type="text"
                          value={stripePub}
                          onChange={(e) => setStripePub(e.target.value)}
                          placeholder="pk_test_..."
                          className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Stripe Secret Key</label>
                        <input
                          type="password"
                          value={stripeSec}
                          onChange={(e) => setStripeSec(e.target.value)}
                          placeholder="sk_test_••••••••"
                          className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-200 font-mono"
                        />
                      </div>

                      {/* Stripe Connect Configuration Section */}
                      <div className="border-t border-slate-850 pt-3.5 space-y-3">
                        <div className="text-[10px] font-black uppercase text-[#cbd5e1] tracking-wider font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                          Stripe Connect split payouts
                        </div>
                        <div className="space-y-1">
                          <label className="block text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider">Connect Client ID</label>
                          <input
                            type="text"
                            value={connectClientId}
                            onChange={(e) => setConnectClientId(e.target.value)}
                            placeholder="ca_FkB8..."
                            className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-200 font-mono text-[11px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider">Connect Webhook Secret</label>
                          <input
                            type="password"
                            value={connectWebhookSec}
                            onChange={(e) => setConnectWebhookSec(e.target.value)}
                            placeholder="whsec_cnct_••••••••"
                            className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-200 font-mono text-[11px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-slate-400 font-mono text-[10px] font-bold">
                            <span>PLATFORM COMMISSION</span>
                            <span className="text-emerald-400">{commissionRate}% FEE</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            step="1"
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(Number(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-850 pt-3">
                        <span className="font-bold text-slate-400">Auto Payout System</span>
                        <input
                          type="checkbox"
                          checked={payoutOption}
                          onChange={(e) => setPayoutOption(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2 font-bold transition text-center cursor-pointer border border-slate-800"
                      >
                        Save Configuration
                      </button>

                      {saveSuccess && (
                        <div className="text-[10px] text-emerald-400 font-bold text-center flex items-center justify-center gap-1 font-mono uppercase">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Parameters committed securely
                        </div>
                      )}
                    </form>
                  </div>

                </div>

                {/* System outputs log, Code Snippets handbooks (Right) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Dynamic Copyable templates handbooks */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3 gap-3">
                      <div>
                        <h4 className="font-extrabold text-slate-100 text-sm uppercase">Boilerplate Endpoint Handbooks</h4>
                        <p className="text-slate-500 text-[11px]">Copy checkout verification listeners directly into server handlers.</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                          <button
                            onClick={() => setActiveLanguage("nodejs")}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition ${activeLanguage === 'nodejs' ? 'bg-slate-800 text-slate-100' : 'text-slate-400'}`}
                          >
                            Node.js
                          </button>
                          <button
                            onClick={() => setActiveLanguage("python")}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition ${activeLanguage === 'python' ? 'bg-slate-800 text-slate-100' : 'text-slate-400'}`}
                          >
                            Python
                          </button>
                        </div>

                        <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                          <button
                            onClick={() => setActiveProvider("stripe")}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition ${activeProvider === 'stripe' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}
                          >
                            Stripe
                          </button>
                          <button
                            onClick={() => setActiveProvider("paypal")}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition ${activeProvider === 'paypal' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}
                          >
                            PayPal
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => handleCopySnippet(codeTemplates[activeLanguage][activeProvider])}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1 text-[10px]"
                      >
                        {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSnippet ? "Copied" : "Copy template"}</span>
                      </button>

                      <pre className="p-4 bg-slate-900/60 text-[10px] text-slate-300 font-mono rounded-xl overflow-x-auto max-h-[300px] pt-12 leading-relaxed border border-slate-850">
                        <code>{codeTemplates[activeLanguage][activeProvider]}</code>
                      </pre>
                    </div>
                  </div>

                  {/* System Logger Ledger Table */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="font-extrabold text-slate-100 text-sm uppercase">Active Sandbox Webhook Logs</h4>
                        <p className="text-slate-500 text-[11px]">Real-time audit stream capturing payment events.</p>
                      </div>
                      
                      <button
                        onClick={downloadWebhookLogsCSV}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-lg text-xxs font-bold transition flex items-center gap-1 hover:text-white cursor-pointer"
                        title="Download transaction log for compliance record"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export CSV</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-850">
                      <table className="w-full text-xs text-left text-slate-300">
                        <thead className="text-[10px] uppercase font-mono font-bold bg-slate-900 text-slate-450 border-b border-slate-850">
                          <tr>
                            <th className="px-4 py-3">Log ID</th>
                            <th className="px-4 py-3">Event Type</th>
                            <th className="px-4 py-3">Timestamp</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                            <th className="px-4 py-3">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 bg-slate-950/40">
                          {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-900/30 font-sans">
                              <td className="px-4 py-2.5 font-mono text-[10.5px] font-bold text-slate-400">{log.id}</td>
                              <td className="px-4 py-2.5">
                                <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-850">
                                  {log.event}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-xxs text-slate-500 font-mono">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                                  log.status === 'Success' ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    log.status === 'Success' ? 'bg-emerald-500' : 'bg-red-500'
                                  }`}></span>
                                  {log.status}
                                </span>
                              </td>
                              <td className={`px-4 py-2.5 text-right font-mono font-bold ${log.amount < 0 ? 'text-slate-400' : 'text-slate-100'}`}>
                                {log.amount === 0 ? "—" : (log.amount < 0 ? `-$${Math.abs(log.amount).toFixed(2)}` : `$${log.amount.toFixed(2)}`)}
                              </td>
                              <td className="px-4 py-2.5 text-xxs text-slate-400 max-w-xs truncate" title={log.details}>
                                {log.details}
                              </td>
                            </tr>
                          ))}
                          {logs.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-slate-500 font-mono text-xxs uppercase">
                                No logs detected in sandbox ledger. Run simulation above.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 3: Finances overview and list of custom skills */}
          {activeTab === "finances" && (
            <motion.div
              key="finances-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8 animate-fade-in"
            >
              
              {/* Gross conversion cards hud metric summary rows */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-metrics-hud font-sans">
                {[
                  { title: "Gross Ecosystem Revenue", val: `$${metrics.grossEarnings.toLocaleString()}`, change: "+14.2% growth", icon: DollarSign, color: "text-[#06b6d4]", bg: "bg-[#06b6d4]/10" },
                  { title: "Predictable MRR Index", val: `$${metrics.mrr.toLocaleString()}`, change: "+8.5% conversion", icon: TrendingUp, color: "text-[#a855f7]", bg: "bg-[#a855f7]/10" },
                  { title: "Active Developer Subs", val: metrics.activeSubscriptions, change: "1,640 potential reach", icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { title: "Free-to-Paid Conversion rate", val: `${metrics.conversionRate}%`, change: "Target MRR: 12.0%", icon: Sparkles, color: "text-amber-400", bg: "bg-amber-500/10" }
                ].map((m, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 p-4.5 rounded-2xl space-y-1.5 shadow-md flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{m.title}</span>
                      <div className="text-lg font-black text-slate-100 font-sans tracking-tight">{m.val}</div>
                      <span className="text-xxs text-slate-500 font-medium block">{m.change}</span>
                    </div>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${m.bg}`}>
                      <m.icon className={`w-4.5 h-4.5 ${m.color}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Graphical simulation analysis history & Skills register */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Skill modules list table - col-span-8 */}
                <div className="xl:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h4 className="font-extrabold text-slate-100 text-sm uppercase">Configured AI Skill Modules</h4>
                    <p className="text-slate-500 text-[11px]">Developer product licenses catalog list.</p>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-850">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead className="text-[10px] uppercase font-mono font-bold bg-slate-900 text-slate-450 border-b border-slate-850">
                        <tr>
                          <th className="px-4 py-3">Skill Name</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Billing System Model</th>
                          <th className="px-4 py-3 text-right">Price Index</th>
                          <th className="px-4 py-3 text-right">Sales Count</th>
                          <th className="px-4 py-3 text-right">Earnings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 bg-slate-950/40">
                        {skills.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-900/30">
                            <td className="px-4 py-3">
                              <div className="space-y-0.5">
                                <span className="font-headline font-bold text-slate-100 block">{s.name}</span>
                                <span className="text-xxs text-slate-500 font-sans block max-w-sm font-medium">{s.description}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-xxs font-mono bg-slate-900 border border-slate-850 select-none">
                                {s.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-400 font-medium">{s.billingModel}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-200">
                              ${s.price.toFixed(s.price < 1 ? 3 : 2)} <span className="text-[9px] text-slate-500 tracking-normal block font-sans font-medium">{s.unit}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-400">{s.salesCount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-400">${s.earnings.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SVG Revenue analytics line chart - col-span-4 */}
                <div className="xl:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="border-b border-slate-800 pb-3">
                    <h4 className="font-extrabold text-slate-100 text-sm uppercase">Ecosystem Velocity Graph</h4>
                    <p className="text-slate-500 text-[11px]">Dynamic transaction trends over the past 7 days.</p>
                  </div>

                  {/* SVG rendering line path natively for unmatched fast load speed */}
                  <div className="relative h-44 w-full">
                    {simulationHistory.length > 0 ? (
                      <svg className="w-full h-full overflow-visible z-5" viewBox="0 0 350 170">
                        <defs>
                          <linearGradient id="area-indigo-glow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        <line x1="0" y1="140" x2="350" y2="140" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                        <line x1="0" y1="80" x2="350" y2="80" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                        <line x1="0" y1="20" x2="350" y2="20" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />

                        {/* Line path construct */}
                        {(() => {
                          const maxEarnings = Math.max(...simulationHistory.map(h => h.revenue), 1);
                          const coordinates = simulationHistory.map((h, index) => {
                            const x = (index / (simulationHistory.length - 1)) * 320 + 15;
                            const y = 140 - (h.revenue / maxEarnings) * 110;
                            return { x, y, val: h.revenue, label: h.date };
                          });

                          const pathD = `M ${coordinates[0].x} ${coordinates[0].y} ` + coordinates.slice(1).map(c => `L ${c.x} ${c.y}`).join(" ");
                          const areaD = `${pathD} L ${coordinates[coordinates.length - 1].x} 140 L ${coordinates[0].x} 140 Z`;

                          return (
                            <>
                              {/* Filled glowing background */}
                              <path d={areaD} fill="url(#area-indigo-glow)" />

                              {/* Drawing lines */}
                              <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

                              {/* Trigger visual circle knobs on values */}
                              {coordinates.map((c, idx) => (
                                <g key={idx}>
                                  <circle cx={c.x} cy={c.y} r="3.5" fill="#090d16" stroke="#a855f7" strokeWidth="2" />
                                  <text x={c.x} y="160" textAnchor="middle" fill="#64748b" className="text-[8.5px] font-mono">{c.label}</text>
                                  {idx === coordinates.length - 1 && (
                                    <text x={c.x} y={c.y - 10} textAnchor="middle" fill="#06b6d4" className="text-[9.5px] font-mono font-black">${c.val.toFixed(0)}</text>
                                  )}
                                </g>
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center font-mono text-slate-500 text-xxs uppercase">
                        Prerequisites loading...
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 font-sans font-medium text-center bg-[#0d1322]/40 p-2 border border-slate-850 rounded-lg">
                    📊 Graph dynamically sums recurring sandbox subscriptions, lifetime API purchase events, and pay-as-you-go reload events.
                  </p>
                </div>

              </div>

              {/* D3-powered Revenue Forecast Component */}
              <RevenueForecast metrics={metrics} />

              {/* D3-powered Ecosystem Monthly Revenue Heatmap Component */}
              <EcosystemHeatmap />

            </motion.div>
          )}

          {/* TAB 4: Premium Skill Analytics and checkout simulation */}
          {activeTab === "payments" && (
            <motion.div
              key="payments-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              
              {/* Payment Hub header alert banner */}
              <div className="bg-emerald-950/20 border border-emerald-900/40 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-emerald-300">Monetization-Ready Payment Sandbox & User Analytics</div>
                  <p className="text-slate-400 leading-relaxed">
                    This interactive interface acts as your premium subscription management platform. Manage developer sandboxes, register client accounts, and simulate real Stripe and PayPal checkout callbacks. Webhooks trigger live API events, instantly updating state balances and audit trails across the ledger.
                  </p>
                </div>
              </div>

              {/* D3 active subscription growth chart */}
              <SubscriptionGrowthChart activeSubscriptions={metrics.activeSubscriptions} />

              {/* Grid 2-columns layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
                
                {/* Developer registries (Left Col - 7 cols) */}
                <div className="lg:col-span-7 space-y-6 animate-fade-in">
                  
                  {/* Account Creator card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-850">
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-black tracking-widest text-[#cbd5e1] uppercase font-mono">
                        Register Test Developer Sandbox
                      </h4>
                    </div>

                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Username</label>
                        <input
                          type="text"
                          required
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          placeholder="e.g. dev_omega"
                          className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-slate-700 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Developer Email</label>
                        <input
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="e.g. omega@hq.io"
                          className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-slate-700 font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 font-mono uppercase h-[36px]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Account</span>
                      </button>
                    </form>
                  </div>

                  {/* Registered users ledger */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="border-b border-slate-855 pb-3 flex justify-between items-center">
                      <div>
                        <h4 className="font-extrabold text-slate-100 text-sm uppercase">Active Developer Sandboxes</h4>
                        <p className="text-slate-500 text-[11px]">Real-time status registers including premium key ownership.</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                        {users.length} Sandbox Accounts
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-850">
                      <table className="w-full text-xs text-left text-slate-300">
                        <thead className="text-[10px] uppercase font-mono font-bold bg-slate-900 text-slate-450 border-b border-slate-855">
                          <tr>
                            <th className="px-4 py-3 font-sans font-bold">Developer</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3">Purchased AI Skills</th>
                            <th className="px-4 py-3 text-right">Integrations Cost</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 bg-slate-955/40">
                          {users.map((user) => (
                            <tr key={user.username} className="hover:bg-slate-900/30">
                              <td className="px-4 py-3">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-200 block font-mono">{user.username}</span>
                                  <span className="text-xxs text-slate-500 block font-medium">{user.email}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {user.premium ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                                    PRO MEMBER
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-500 border border-slate-750 uppercase tracking-wider">
                                    FREE TIER
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 max-w-xs font-sans">
                                {user.purchased_skills && user.purchased_skills.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {user.purchased_skills.map((skillId: string) => {
                                      const sk = skills.find(s => s.id === skillId);
                                      return (
                                        <span key={skillId} className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] border border-slate-850 font-medium whitespace-nowrap">
                                          {sk ? sk.name : skillId}
                                        </span>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-slate-505 italic text-xxs">No premium skills activated</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-extrabold text-[#06b6d4]">
                                ${user.totalSpent?.toFixed(2) || "0.00"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => {
                                    setCheckoutUser(user.username);
                                    if (skills.length > 0 && !checkoutSkill) {
                                      setCheckoutSkill(skills[0].id);
                                    }
                                    const rect = document.getElementById("checkout-sandbox-terminal");
                                    if (rect) rect.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold bg-slate-900 hover:bg-slate-850 px-2.5 py-1 rounded border border-slate-800 hover:border-emerald-500 transition cursor-pointer"
                                >
                                  Buy Skill
                                </button>
                              </td>
                            </tr>
                          ))}
                          {users.length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center py-8 text-slate-550 font-mono text-xxs uppercase">
                                No registered test clients found. Use form above to seed accounts.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Stripe Connect Multi-Tenant Developer Sub-Accounts & Payouts Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                      <div>
                        <h4 className="font-extrabold text-[#cbd5e1] text-xs uppercase font-mono tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                          Stripe Connect Payout ledger
                        </h4>
                        <p className="text-slate-505 text-[10.5px] font-sans">
                          Link developer sub-accounts & dispatch split revenue payouts minus commission fee.
                        </p>
                      </div>

                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-purple-400">
                        {users.filter(u => u.stripeConnectId).length} MERCHANT ACCOUNTS
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-850">
                      <table className="w-full text-xs text-left text-slate-300">
                        <thead className="text-[10px] uppercase font-mono font-bold bg-slate-900 text-slate-450 border-b border-slate-855">
                          <tr>
                            <th className="px-4 py-3 font-sans font-bold">Developer</th>
                            <th className="px-4 py-3">Stripe Sub-account</th>
                            <th className="px-3 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Owner Balance</th>
                            <th className="px-4 py-3 text-center">Payout Controller</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 bg-slate-955/40">
                          {users.map((user) => {
                            const isLinked = user.connectStatus === "active";
                            const isPending = user.connectStatus === "pending";
                            const isUnlinked = !user.connectStatus || user.connectStatus === "unlinked";
                            
                            // Platform kept held fee available for payout: totalSpent * 80% (minus 20% platform fee)
                            const earnedBalance = (user.totalSpent * ((100 - (commissionRate || 20)) / 100));

                            return (
                              <tr key={`connect-${user.username}`} className="hover:bg-slate-900/30">
                                <td className="px-4 py-3">
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-slate-200 block font-mono text-[11px]">{user.username}</span>
                                    <span className="text-xxs text-slate-500 block font-medium font-mono">Commission: {commissionRate || 20}%</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {user.stripeConnectId ? (
                                    <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                                      <span className="text-slate-300 font-bold max-w-[80px] truncate" title={user.stripeConnectId}>
                                        {user.stripeConnectId}
                                      </span>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(user.stripeConnectId || "");
                                          alert("Copied connected account ID to clipboard!");
                                        }}
                                        className="text-slate-500 hover:text-slate-300 hover:bg-slate-900 p-1 rounded transition cursor-pointer"
                                        title="Copy Stripe Connected ID"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-slate-600 font-mono italic text-xxs">No connected sub-account</span>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-center">
                                  {isLinked && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-[#10b981]/25 uppercase">
                                      ACTIVE
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-[#f59e0b]/25 uppercase animate-pulse">
                                      PENDING
                                    </span>
                                  )}
                                  {isUnlinked && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-slate-850 text-slate-500 border border-slate-750 uppercase">
                                      UNLINKED
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-extrabold text-[#a855f7] text-[11px]">
                                  ${earnedBalance.toFixed(2)}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-2">
                                    {isUnlinked && (
                                      <button
                                        onClick={() => handleConnectLink(user.username)}
                                        className="text-[10px] text-purple-400 hover:text-purple-300 font-bold bg-slate-900 hover:bg-slate-850 px-2.5 py-1 rounded border border-slate-800 hover:border-purple-500 transition cursor-pointer"
                                      >
                                        Link Sub-account
                                      </button>
                                    )}
                                    {isPending && (
                                      <button
                                        onClick={() => handleConnectToggleStatus(user.username, "active")}
                                        className="text-[10px] text-amber-400 hover:text-amber-300 font-bold bg-slate-900 hover:bg-slate-850 px-2.5 py-1.5 rounded border border-slate-800 hover:border-amber-500 transition cursor-pointer flex items-center gap-1 font-mono uppercase"
                                      >
                                        <span>Onboard</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                    {isLinked && (
                                      <div className="flex items-center gap-1.5 justify-center">
                                        <input
                                          type="number"
                                          placeholder="Amt"
                                          value={connectPayoutAmounts[user.username] || ""}
                                          onChange={(e) => setConnectPayoutAmounts(prev => ({ ...prev, [user.username]: e.target.value }))}
                                          className="w-14 bg-slate-900 border border-slate-800 text-slate-200 text-xxs font-mono rounded px-1.5 py-1 outline-none text-right focus:border-purple-500"
                                        />
                                        <button
                                          onClick={() => handleConnectPayout(user.username)}
                                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-black bg-slate-900 hover:bg-slate-850 px-2 py-1 rounded border border-slate-850 transition cursor-pointer"
                                        >
                                          Pay
                                        </button>
                                        <button
                                          onClick={() => handleConnectToggleStatus(user.username, "unlinked")}
                                          className="text-[9px] text-slate-500 hover:text-red-400 px-1 hover:underline transition cursor-pointer"
                                          title="De-authorize Stripe Connected account"
                                        >
                                          Disconnect
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* Simulated Payment Gateway card (Right Col - 5 cols) */}
                <div className="lg:col-span-5 space-y-6" id="checkout-sandbox-terminal">
                  
                  {/* High Fidelity Checkout Terminal card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-850">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-black tracking-widest text-[#cbd5e1] uppercase font-mono">
                        Secure simulated payment gateway
                      </h4>
                    </div>

                    <div className="space-y-4 text-xs font-sans">
                      
                      {/* Customer select */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Target client account
                        </label>
                        <select
                          value={checkoutUser}
                          onChange={(e) => setCheckoutUser(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-slate-200 font-mono focus:outline-none"
                        >
                          <option value="">-- Choose Test Developer --</option>
                          {users.map((u) => (
                            <option key={u.username} value={u.username}>
                              {u.username} ({u.premium ? 'PRO Member' : 'Free'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Premium AI skill select */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Select premium AI skill to deploy
                        </label>
                        <select
                          value={checkoutSkill}
                          onChange={(e) => setCheckoutSkill(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-slate-200 font-sans font-medium focus:outline-none"
                        >
                          <option value="">-- Select premium AI license --</option>
                          {skills.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} — ${s.price.toFixed(s.price < 1 ? 3 : 2)} ({s.billingModel})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Payment method selection */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Choose payment broker channel
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setCheckoutProvider("stripe")}
                            className={`p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                              checkoutProvider === 'stripe'
                                ? 'bg-[#4f46e5]/10 text-[#818cf8] border-[#4f46e5]'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-indigo-505 animate-pulse"></span>
                            <span>Stripe Checkout</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCheckoutProvider("paypal")}
                            className={`p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                              checkoutProvider === 'paypal'
                                ? 'bg-[#d97706]/10 text-[#fbbf24] border-[#d97706]'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>PayPal Sandbox</span>
                          </button>
                        </div>
                      </div>

                      {/* Payment form mockup inputs */}
                      <div className="bg-[#0c1322] border border-slate-850 p-4.5 rounded-xl space-y-3 font-sans">
                        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                          <span className="font-bold text-[10px] uppercase font-mono tracking-wider">Gateway Secure Sandbox</span>
                          <span className="font-mono text-[9px] px-1 bg-emerald-500/10 text-emerald-400 rounded">SSL Encrypted</span>
                        </div>

                        {checkoutProvider === 'stripe' ? (
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Card number</span>
                              <div className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-300 text-[11px] font-mono select-none">
                                4242  ••••  ••••  4242
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Expiry</span>
                                <div className="bg-slate-950 border border-slate-850 p-2 rounded text-slate-300 text-[11px] font-mono select-none">
                                  12 / 29
                                </div>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">CVV</span>
                                <div className="bg-slate-950 border border-slate-850 p-2 rounded text-slate-300 text-[11px] font-mono select-none">
                                  •••
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-center py-2.5">
                            <div className="inline-flex items-center gap-1 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] text-amber-400 font-mono select-none">
                              <span>paypal-sandbox-client@company.org</span>
                            </div>
                            <p className="text-[10px] text-slate-500">Auto-authenticates payload on submission.</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                          <span className="text-slate-400 text-xs font-semibold">Deploy License Price</span>
                          <span className="text-sm font-black font-mono text-white">
                            {(() => {
                              const sk = skills.find(s => s.id === checkoutSkill);
                              return sk ? `$${sk.price.toFixed(2)}` : "$0.00";
                            })()}
                          </span>
                        </div>
                      </div>

                      {/* Run simulator button */}
                      <button
                        onClick={handlePurchaseSkill}
                        disabled={checkoutStatus === "processing" || !checkoutUser || !checkoutSkill}
                        className={`w-full font-mono text-xxxs tracking-wider uppercase font-extrabold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                          !checkoutUser || !checkoutSkill
                            ? "bg-slate-900 text-slate-500 border border-slate-850 cursor-not-allowed"
                            : checkoutProvider === "stripe"
                              ? "bg-slate-100 text-[#090d16] hover:bg-white"
                              : "bg-[#eab308] hover:bg-[#ca8a04] text-slate-950"
                        }`}
                      >
                        {checkoutStatus === "processing" ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent animate-spin rounded-full"></span>
                            <span>VALIDATING TRANSACTION PLUG...</span>
                          </>
                        ) : checkoutStatus === "success" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                            <span>TRANSACTION AUTHORIZED & LEDGERED</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-3.5 h-3.5" />
                            <span>AUTHORIZE WEBHOOK API EVENT</span>
                          </>
                        )}
                      </button>

                      {/* Display live indicators */}
                      {checkoutStatus === "success" && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-emerald-950/20 border border-emerald-900/50 p-3 rounded-xl space-y-1 text-center font-mono text-xxs text-emerald-400 uppercase"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto animate-bounce mt-1" />
                          <div className="font-bold">Transaction Confirmed!</div>
                          <p className="text-[10px] text-slate-400 normal-case font-sans">
                            Callback emitted. Database client updated, gross earnings upgraded on sandbox telemetry charts.
                          </p>
                        </motion.div>
                      )}

                      {checkoutStatus === "error" && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-950/20 border border-red-900/50 p-3 rounded-xl text-center font-mono text-xxs text-red-500 uppercase"
                        >
                          <XCircle className="w-4 h-4 text-red-500 mx-auto mb-1" />
                          <div>Gate Rejected: {checkoutError}</div>
                        </motion.div>
                      )}

                    </div>
                  </div>

                  {/* Backend Parity Console: analytics endpoint */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#06b6d4]" />
                        <h4 className="text-xs font-black tracking-widest text-[#cbd5e1] uppercase font-mono">
                          Python / Node Server Parity JSON
                        </h4>
                      </div>
                      
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/payment/analytics");
                            const analJson = await res.json();
                            navigator.clipboard.writeText(JSON.stringify(analJson, null, 2));
                            setCopiedAnalyticsJson(true);
                            setTimeout(() => setCopiedAnalyticsJson(false), 2000);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 p-1.5 rounded-lg text-[#cbd5e1] text-xxs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Copy analytic response payload to clipboard"
                      >
                        {copiedAnalyticsJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAnalyticsJson ? "Copied" : "Copy Response"}</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                        <span className="bg-[#0f172a] px-1.5 py-0.5 rounded text-[#06b6d4]">GET /api/payment/analytics</span>
                        <span>Signature Match: Flask API</span>
                      </div>

                      <pre className="p-3.5 bg-slate-900/60 text-[10px] text-slate-350 font-mono rounded-xl overflow-x-auto max-h-[160px] leading-relaxed border border-slate-850">
                        <code>
                          {JSON.stringify({
                            success: true,
                            premium_skill_usage: users.reduce((acc, u) => {
                              acc[u.username] = u.purchased_skills?.length || 0;
                              return acc;
                            }, {}),
                            total_users: users.length,
                            premium_conversions: users.filter(u => u.premium).length,
                            premium_percentage: parseFloat(((users.filter(u => u.premium).length / Math.max(users.length, 1)) * 100).toFixed(1))
                          }, null, 2)}
                        </code>
                      </pre>
                    </div>
                  </div>

                </div>

              </div>

            </motion.div>
          )}

          {activeTab === "stock" && (
            <motion.div
              key="stock-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <StockAnalysisDemo />
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* FOOTER status HUD */}
      <footer className="border-t border-slate-900 bg-[#06090e] mt-12 py-5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xxs font-mono text-slate-550 font-bold uppercase tracking-widest text-[#64748b]/85">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
            <span>This map is a living system. Update it as new signals emerge and patterns evolve.</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <span>Observe</span>
            <ChevronRight className="w-3 h-3 text-slate-700" />
            <span>Connect</span>
            <ChevronRight className="w-3 h-3 text-slate-700" />
            <span>Understand</span>
            <ChevronRight className="w-3 h-3 text-slate-700" />
            <span>Act</span>
            <ChevronRight className="w-3 h-3 text-slate-700" />
            <span className="text-[#a855f7]">Compounding Advantage</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
