import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Sliders, 
  Percent, 
  TrendingDown, 
  ArrowDownRight, 
  ShieldAlert,
  Clock,
  Check,
  RefreshCw,
  Mail,
  Phone,
  Plus,
  Send,
  Eye,
  Settings
} from "lucide-react";
import { MetricSummary } from "../types";

interface RevenueAlertCenterProps {
  metrics: MetricSummary;
}

interface CustomThresholdRule {
  id: string;
  metric: "grossEarnings" | "mrr";
  thresholdValue: number;
  channel: "Email" | "SMS";
  destination: string;
  isEnabled: boolean;
  createdAt: string;
}

interface NotificationAuditLog {
  id: string;
  timestamp: string;
  ruleId: string;
  metric: "grossEarnings" | "mrr";
  channel: "Email" | "SMS";
  destination: string;
  valueAtTrigger: number;
  thresholdValue: number;
  message: string;
}

export default function RevenueAlertCenter({ metrics }: RevenueAlertCenterProps) {
  // Navigation inside the Alert Center
  const [activeSubTab, setActiveSubTab] = useState<"threshold_rules" | "percentage_drops">("threshold_rules");

  // State for user-defined threshold-based SMS/Email alerts
  const [customRules, setCustomRules] = useState<CustomThresholdRule[]>(() => {
    const saved = localStorage.getItem("ecosystem_custom_threshold_rules");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: "rule-1",
        metric: "mrr",
        thresholdValue: 2000,
        channel: "SMS",
        destination: "+1 (555) 019-2834",
        isEnabled: true,
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
      },
      {
        id: "rule-2",
        metric: "grossEarnings",
        thresholdValue: 12000,
        channel: "Email",
        destination: "rufustent@gmail.com",
        isEnabled: true,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
      }
    ];
  });

  // State for generated / simulated logs of triggered threshold alerts
  const [auditLogs, setAuditLogs] = useState<NotificationAuditLog[]>(() => {
    const saved = localStorage.getItem("ecosystem_custom_threshold_audit_logs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: "log-1",
        timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
        ruleId: "rule-1",
        metric: "mrr",
        channel: "SMS",
        destination: "+1 (555) 019-2834",
        valueAtTrigger: 1950,
        thresholdValue: 2000,
        message: "SMS Alert dispatched to +1 (555) 019-2834: '⚠️ GUARDRAIL BREACH: Predictable MRR Index fell to $1,950.00 (Threshold: $2,000.00).'"
      }
    ];
  });

  // Simulation metrics modifier so the user can actually test and see alerts trigger!
  const [simulationDepletionCoeff, setSimulationDepletionCoeff] = useState<number>(100); // percentage (100% = normal)

  // Form states
  const [newRuleMetric, setNewRuleMetric] = useState<"grossEarnings" | "mrr">("grossEarnings");
  const [newRuleThreshold, setNewRuleThreshold] = useState<string>("10000");
  const [newRuleChannel, setNewRuleChannel] = useState<"Email" | "SMS">("Email");
  const [newRuleDestination, setNewRuleDestination] = useState<string>("rufustent@gmail.com");
  const [formError, setFormError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Current calculated (simulated) metric values
  const simulatedGross = (metrics.grossEarnings * (simulationDepletionCoeff / 100));
  const simulatedMrr = (metrics.mrr * (simulationDepletionCoeff / 100));

  // Auto-fill form destination helper
  useEffect(() => {
    if (newRuleChannel === "Email") {
      setNewRuleDestination("rufustent@gmail.com");
      if (newRuleMetric === "grossEarnings") {
        setNewRuleThreshold(Math.round(metrics.grossEarnings * 0.85).toString());
      } else {
        setNewRuleThreshold(Math.round(metrics.mrr * 0.85).toString());
      }
    } else {
      setNewRuleDestination("+1 (555) 019-2834");
      if (newRuleMetric === "grossEarnings") {
        setNewRuleThreshold(Math.round(metrics.grossEarnings * 0.8).toString());
      } else {
        setNewRuleThreshold(Math.round(metrics.mrr * 0.8).toString());
      }
    }
  }, [newRuleChannel, newRuleMetric, metrics]);

  // Persist rules & logs
  useEffect(() => {
    localStorage.setItem("ecosystem_custom_threshold_rules", JSON.stringify(customRules));
  }, [customRules]);

  useEffect(() => {
    localStorage.setItem("ecosystem_custom_threshold_audit_logs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Background Evaluation loop when metrics or rules change
  useEffect(() => {
    // Check if any rule has breached the simulated thresholds
    customRules.forEach(rule => {
      if (!rule.isEnabled) return;

      const currentValue = rule.metric === "grossEarnings" ? simulatedGross : simulatedMrr;
      
      // If simulated value drops below threshold, we trigger an alert
      if (currentValue < rule.thresholdValue) {
        // Check if an audit log for this rule was already generated in the last 10 seconds to avoid spamming
        const lastTriggered = auditLogs.find(log => log.ruleId === rule.id && (Date.now() - new Date(log.timestamp).getTime() < 12000));
        
        if (!lastTriggered) {
          const formattedCurrent = currentValue.toLocaleString("en-US", { style: "currency", currency: "USD" });
          const formattedThreshold = rule.thresholdValue.toLocaleString("en-US", { style: "currency", currency: "USD" });
          const metricLabel = rule.metric === "grossEarnings" ? "Gross Ecosystem Revenue" : "Predictable MRR Index";

          let msg = "";
          if (rule.channel === "Email") {
            msg = `[Email Subject: [URGENT ALERT] ${metricLabel} Guardrail Breach] Sent to ${rule.destination}. Content: The system detected that your ${metricLabel} has dropped to ${formattedCurrent}, which is below your safety threshold of ${formattedThreshold}. Please log in to inspect.`;
          } else {
            msg = `[SMS dispatched to ${rule.destination}] ⚠️ GUARDRAIL BREACH: ${metricLabel} has fallen to ${formattedCurrent}, breaching your threshold configuration of ${formattedThreshold}. timestamp: ${new Date().toLocaleTimeString()}`;
          }

          const newLog: NotificationAuditLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: new Date().toISOString(),
            ruleId: rule.id,
            metric: rule.metric,
            channel: rule.channel,
            destination: rule.destination,
            valueAtTrigger: currentValue,
            thresholdValue: rule.thresholdValue,
            message: msg
          };

          setAuditLogs(prev => [newLog, ...prev]);
        }
      }
    });
  }, [simulationDepletionCoeff, customRules, metrics]);

  // Handle Form Submission to Create Custom Rule
  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    const val = parseFloat(newRuleThreshold);
    if (isNaN(val) || val <= 0) {
      setFormError("Please enter a valid numeric threshold value greater than 0.");
      return;
    }

    if (!newRuleDestination.trim()) {
      setFormError("Notification endpoint cannot be empty.");
      return;
    }

    if (newRuleChannel === "Email" && !newRuleDestination.includes("@")) {
      setFormError("Please enter a valid email address (e.g., developer@example.com).");
      return;
    }

    if (newRuleChannel === "SMS" && !/^\+?[0-9\s\-()]{7,20}$/.test(newRuleDestination)) {
      setFormError("Please enter a valid phone number (e.g., +1 (555) 019-2834).");
      return;
    }

    const newRule: CustomThresholdRule = {
      id: `rule-${Date.now()}`,
      metric: newRuleMetric,
      thresholdValue: val,
      channel: newRuleChannel,
      destination: newRuleDestination,
      isEnabled: true,
      createdAt: new Date().toISOString()
    };

    setCustomRules(prev => [newRule, ...prev]);
    setSuccessMessage(`Successfully created custom ${newRuleChannel} guardrail alert for ${newRuleMetric === "grossEarnings" ? "Gross Revenue" : "MRR"} drops below $${val.toLocaleString()}!`);
    
    // Clear success message after 4s
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleDeleteRule = (id: string) => {
    setCustomRules(prev => prev.filter(r => r.id !== id));
  };

  const toggleRuleEnabled = (id: string) => {
    setCustomRules(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, isEnabled: !r.isEnabled };
      }
      return r;
    }));
  };

  const handleTestTrigger = (rule: CustomThresholdRule) => {
    const formattedVal = rule.thresholdValue.toLocaleString("en-US", { style: "currency", currency: "USD" });
    const metricLabel = rule.metric === "grossEarnings" ? "Gross Ecosystem Revenue" : "Predictable MRR Index";
    const currentValue = rule.metric === "grossEarnings" ? simulatedGross : simulatedMrr;
    const formattedCurrent = currentValue.toLocaleString("en-US", { style: "currency", currency: "USD" });

    let msg = "";
    if (rule.channel === "Email") {
      msg = `[TEST Email Sent to ${rule.destination}] Subject: [TEST ALERT] ${metricLabel} Guardrail. Alert rule configured for < ${formattedVal}. Current system value is ${formattedCurrent}.`;
    } else {
      msg = `[TEST SMS Dispatched to ${rule.destination}] 🧪 TEST ALERT: Current ${metricLabel} value is ${formattedCurrent} (Trigger threshold: < ${formattedVal}). Connection tested successfully.`;
    }

    const testLog: NotificationAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ruleId: rule.id,
      metric: rule.metric,
      channel: rule.channel,
      destination: rule.destination,
      valueAtTrigger: currentValue,
      thresholdValue: rule.thresholdValue,
      message: msg
    };

    setAuditLogs(prev => [testLog, ...prev]);
  };

  const handleClearAuditLogs = () => {
    setAuditLogs([]);
  };


  // --- Existing Percentage-based Alert State logic ---
  const [thresholdPercent, setThresholdPercent] = useState<number>(10);
  const [comparisonBaseline, setComparisonBaseline] = useState<"7_day_avg" | "day_over_day" | "mrr_target">("7_day_avg");
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  
  const [percentageAlerts, setPercentageAlerts] = useState<any[]>(() => {
    const saved = localStorage.getItem("ecosystem_revenue_percentage_alerts");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: "alert-1",
        timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
        type: "revenue_drop",
        percentageDrop: 18.4,
        currentValue: 1450,
        baselineValue: 1777,
        severity: "Critical",
        status: "Active",
        description: "API Gateway billing transaction aggregate dropped by 18.4% below the 7-day rolling average threshold.",
      },
      {
        id: "alert-2",
        timestamp: new Date(Date.now() - 28 * 3600000).toISOString(),
        type: "subscription_churn",
        percentageDrop: 12.5,
        currentValue: 112,
        baselineValue: 128,
        severity: "Warning",
        status: "Resolved",
        description: "Flat Subscription active subscriber count fell below the baseline target of 120 developers.",
        actionTaken: "Triggered promotional credit upsells via developer newsletter outreach campaign."
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("ecosystem_revenue_percentage_alerts", JSON.stringify(percentageAlerts));
  }, [percentageAlerts]);

  const handleSimulatePercentDrop = () => {
    const randomDrop = parseFloat((11 + Math.random() * 24).toFixed(1));
    const baseline = 2150;
    const current = Math.round(baseline * (1 - randomDrop / 100));
    const severity = randomDrop > 20 ? "Critical" : "Warning";
    
    const newAlert = {
      id: `alert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "revenue_drop",
      percentageDrop: randomDrop,
      currentValue: current,
      baselineValue: baseline,
      severity: severity,
      status: "Active",
      description: `Dynamic Simulation: Automated check detected actual hourly revenue dropped to $${current} against a comparison baseline of $${baseline} (-${randomDrop}% variance).`
    };

    setPercentageAlerts(prev => [newAlert, ...prev]);
  };

  const handleResolvePercentAlert = (id: string) => {
    setPercentageAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "Resolved", actionTaken: "Resolved from standard admin console panel." } : a));
  };

  const handleDeletePercentAlert = (id: string) => {
    setPercentageAlerts(prev => prev.filter(a => a.id !== id));
  };


  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-6">
      
      {/* Alert Center Header */}
      <div className="border-b border-slate-850 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-5 h-5 text-indigo-400" />
              {customRules.filter(r => r.isEnabled).length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white font-sans text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-950">
                  {customRules.filter(r => r.isEnabled).length}
                </span>
              )}
            </div>
            <h4 className="font-extrabold text-slate-100 text-sm uppercase tracking-wider font-mono">
              Ecosystem Revenue Drop Notification Center
            </h4>
          </div>
          <p className="text-slate-500 text-[11px]">
            Configure custom triggers, define absolute value guardrails, and dispatch simulated email or SMS alerts when revenue metrics fall.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl self-start md:self-auto shrink-0">
          <button
            onClick={() => setActiveSubTab("threshold_rules")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all font-mono flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "threshold_rules"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Value Guardrails (Email/SMS)
          </button>
          <button
            onClick={() => setActiveSubTab("percentage_drops")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all font-mono flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "percentage_drops"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            Percentage Drops (% Var)
          </button>
        </div>
      </div>

      {/* RENDER TAB 1: USER-DEFINED VALUE GUARDRAILS (EMAIL / SMS ALERTS) */}
      {activeSubTab === "threshold_rules" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Rule Creator Form (Left Column) */}
          <div className="lg:col-span-5 bg-slate-900/30 border border-slate-850 rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-850">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span className="text-[11.5px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                Create Guardrail Alert
              </span>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              
              {/* Metric Field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Select Metric to Guard
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRuleMetric("grossEarnings")}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition font-mono flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      newRuleMetric === "grossEarnings"
                        ? "bg-indigo-500/10 border-indigo-500/35 text-indigo-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span>Gross Revenue</span>
                    <span className="text-[9px] font-medium text-slate-500">
                      Live: ${metrics.grossEarnings.toLocaleString()}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRuleMetric("mrr")}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition font-mono flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      newRuleMetric === "mrr"
                        ? "bg-indigo-500/10 border-indigo-500/35 text-indigo-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span>Predictable MRR</span>
                    <span className="text-[9px] font-medium text-slate-500">
                      Live: ${metrics.mrr.toLocaleString()}
                    </span>
                  </button>
                </div>
              </div>

              {/* Threshold Value */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Trigger When Drops Below
                  </label>
                  <span className="text-[10px] font-bold text-indigo-400 font-mono">
                    Current: ${newRuleMetric === "grossEarnings" ? metrics.grossEarnings.toLocaleString() : metrics.mrr.toLocaleString()}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 text-xs font-mono">$</span>
                  <input
                    type="number"
                    value={newRuleThreshold}
                    onChange={(e) => setNewRuleThreshold(e.target.value)}
                    placeholder="Enter absolute limit value"
                    className="w-full bg-slate-900 border border-slate-800 pl-7 pr-3 py-1.5 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-indigo-500/20"
                    required
                  />
                </div>
                {/* Preset shortcuts */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-slate-500 uppercase font-mono">Presets:</span>
                  {[0.9, 0.75, 0.5].map((pct) => {
                    const base = newRuleMetric === "grossEarnings" ? metrics.grossEarnings : metrics.mrr;
                    const calculatedPreset = Math.round(base * pct);
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setNewRuleThreshold(calculatedPreset.toString())}
                        className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-indigo-300 text-[9px] font-mono transition cursor-pointer"
                      >
                        {pct * 100}% (${calculatedPreset.toLocaleString()})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notification Channel */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Notification Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRuleChannel("Email")}
                    className={`p-2 rounded-lg border text-xs font-bold transition font-mono flex items-center justify-center gap-1.5 cursor-pointer ${
                      newRuleChannel === "Email"
                        ? "bg-indigo-500/10 border-indigo-500/35 text-indigo-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email Alert
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRuleChannel("SMS")}
                    className={`p-2 rounded-lg border text-xs font-bold transition font-mono flex items-center justify-center gap-1.5 cursor-pointer ${
                      newRuleChannel === "SMS"
                        ? "bg-indigo-500/10 border-indigo-500/35 text-indigo-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    SMS Alert
                  </button>
                </div>
              </div>

              {/* Endpoint target */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {newRuleChannel === "Email" ? "Destination Email Address" : "Destination Mobile Phone Number"}
                </label>
                <input
                  type={newRuleChannel === "Email" ? "email" : "text"}
                  value={newRuleDestination}
                  onChange={(e) => setNewRuleDestination(e.target.value)}
                  placeholder={newRuleChannel === "Email" ? "developer@example.com" : "+1 (555) 019-2834"}
                  className="w-full bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-700"
                  required
                />
              </div>

              {formError && (
                <div className="p-2.5 rounded bg-rose-950/20 border border-rose-900/30 text-rose-400 text-xxs flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xxs flex items-start gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold font-mono text-[11px] rounded-lg transition-all uppercase shadow-md shadow-indigo-950/20 tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Activate Alert Guardrail
              </button>
            </form>

            {/* Sandbox Simulation Deck */}
            <div className="pt-3 border-t border-slate-850 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-amber-500" />
                  Ecosystem Stress Sandbox
                </span>
                {simulationDepletionCoeff < 100 && (
                  <button
                    onClick={() => setSimulationDepletionCoeff(100)}
                    className="text-[9px] font-bold font-mono text-amber-500 hover:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded transition cursor-pointer"
                  >
                    Reset System
                  </button>
                )}
              </div>
              
              <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-850">
                <div className="flex justify-between items-center text-xxs">
                  <span className="text-slate-400 font-medium">Simulate Depletion Level:</span>
                  <span className={`font-mono font-bold ${simulationDepletionCoeff < 80 ? "text-rose-400 animate-pulse" : "text-amber-400"}`}>
                    {simulationDepletionCoeff}% Capacity
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  step="5"
                  value={simulationDepletionCoeff}
                  onChange={(e) => setSimulationDepletionCoeff(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono pt-1">
                  <div>
                    <span className="text-slate-500 block uppercase">Simulated Gross:</span>
                    <span className={simulationDepletionCoeff < 100 ? "text-amber-400 font-bold" : "text-slate-300"}>
                      ${simulatedGross.toLocaleString("en-US", { maximumFractionDigits: 1 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase">Simulated MRR:</span>
                    <span className={simulationDepletionCoeff < 100 ? "text-amber-400 font-bold" : "text-slate-300"}>
                      ${simulatedMrr.toLocaleString("en-US", { maximumFractionDigits: 1 })}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] text-slate-500 block leading-normal pt-1.5 border-t border-slate-900">
                  💡 Drag the slider left to simulate a severe drop in Gross Revenue or MRR. Your active guardrails will immediately trigger and log a notification mock transaction below!
                </span>
              </div>
            </div>

          </div>

          {/* Rules List & Audit Logs (Right Column) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Active Guardrails Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-850">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Active Guardrail Rules ({customRules.length})
                </span>
                <span className="text-[9.5px] text-slate-500 italic">Rules evaluated live against current system state</span>
              </div>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {customRules.map((rule) => {
                  const currentValue = rule.metric === "grossEarnings" ? simulatedGross : simulatedMrr;
                  const isTriggered = currentValue < rule.thresholdValue;
                  const metricLabel = rule.metric === "grossEarnings" ? "Gross Ecosystem Revenue" : "Predictable MRR Index";

                  return (
                    <div
                      key={rule.id}
                      className={`p-3.5 rounded-xl border transition-all duration-250 ${
                        !rule.isEnabled
                          ? "bg-slate-950/20 border-slate-900 opacity-50"
                          : isTriggered
                          ? "bg-rose-950/5 border-rose-900/40 shadow-sm shadow-rose-950/10"
                          : "bg-slate-900/40 border-slate-850 hover:border-slate-800"
                      } flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-slate-200 text-xs font-bold font-sans">
                            {metricLabel}
                          </span>
                          
                          <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold font-mono border flex items-center gap-1 ${
                            rule.channel === "Email"
                              ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          }`}>
                            {rule.channel === "Email" ? <Mail className="w-2.5 h-2.5" /> : <Phone className="w-2.5 h-2.5" />}
                            {rule.channel}
                          </span>

                          <span className="text-[9.5px] text-slate-500 font-mono">
                            {rule.destination}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xxs text-slate-400 font-mono mt-1">
                          <span>Safety Floor Limit:</span>
                          <span className="text-slate-200 font-bold">${rule.thresholdValue.toLocaleString()}</span>
                          <span className="text-slate-600">|</span>
                          <span>Live Simulated Value:</span>
                          <span className={isTriggered ? "text-rose-400 font-bold" : "text-emerald-400 font-semibold"}>
                            ${currentValue.toLocaleString("en-US", { maximumFractionDigits: 1 })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        
                        {/* Status Badge */}
                        <div className="mr-1.5">
                          {!rule.isEnabled ? (
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[8.5px] font-bold text-slate-500 font-mono uppercase">
                              MUTED
                            </span>
                          ) : isTriggered ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[8.5px] font-bold text-rose-400 font-mono uppercase animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              TRIGGERED
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8.5px] font-bold text-emerald-400 font-mono uppercase flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              MONITORING
                            </span>
                          )}
                        </div>

                        {/* Toggle button */}
                        <button
                          onClick={() => toggleRuleEnabled(rule.id)}
                          className={`p-1 rounded border text-xxs font-bold transition font-mono cursor-pointer ${
                            rule.isEnabled
                              ? "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-amber-400"
                              : "bg-indigo-950/10 border-indigo-900/30 text-indigo-400"
                          }`}
                          title={rule.isEnabled ? "Mute Alert Rule" : "Unmute Alert Rule"}
                        >
                          {rule.isEnabled ? "Mute" : "Unmute"}
                        </button>

                        {/* Test trigger button */}
                        {rule.isEnabled && (
                          <button
                            onClick={() => handleTestTrigger(rule)}
                            className="p-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-emerald-400 rounded transition cursor-pointer"
                            title="Send Test Dispatch"
                          >
                            <Send className="w-3 h-3" />
                          </button>
                        )}

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer"
                          title="Delete Guardrail"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                    </div>
                  );
                })}

                {customRules.length === 0 && (
                  <div className="py-8 border border-dashed border-slate-850 rounded-xl text-center space-y-2">
                    <Sliders className="w-8 h-8 text-slate-700 mx-auto" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-400 text-xs">No active guardrails defined</p>
                      <p className="text-[10px] text-slate-550">
                        Use the creator form to define email/SMS drop alerts.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Audit Logs Log Center */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-850">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                  Triggered Alert Dispatch Logs ({auditLogs.length})
                </span>
                {auditLogs.length > 0 && (
                  <button
                    onClick={handleClearAuditLogs}
                    className="text-[9px] font-medium font-mono text-slate-500 hover:text-rose-400 transition cursor-pointer"
                  >
                    Clear History
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-950 border border-slate-900 rounded-lg space-y-1.5"
                  >
                    <div className="flex justify-between items-center text-xxs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1 rounded text-[8px] font-black uppercase ${
                          log.channel === "Email"
                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/25"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                        }`}>
                          {log.channel} DISPATCH
                        </span>
                        <span className="text-slate-500">to {log.destination}</span>
                      </div>
                      <span className="text-slate-600 flex items-center gap-0.5 text-[9px]">
                        <Clock className="w-3 h-3 text-slate-750" />
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-slate-300 font-sans leading-relaxed">
                      {log.message}
                    </p>
                  </div>
                ))}

                {auditLogs.length === 0 && (
                  <div className="py-8 text-center text-slate-600 text-xxs italic font-mono">
                    No notifications sent yet. Lower simulated value threshold or click "🧪 Test Dispatch" to fire an alert simulation.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}


      {/* RENDER TAB 2: PERCENTAGE DROPS LOG (PRESERVED LOGS) */}
      {activeSubTab === "percentage_drops" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Config column */}
          <div className="lg:col-span-4 bg-slate-900/40 border border-slate-850 rounded-xl p-4.5 space-y-5">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-850">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                Threshold Parameters
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Drop Sensitivity</span>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px]">
                  {thresholdPercent}% Variance
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="5"
                value={thresholdPercent}
                onChange={(e) => setThresholdPercent(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
              />
              <span className="text-[9.5px] text-slate-500 block leading-normal">
                Triggers warning flags if current ecosystem earnings fall below baseline by this margin.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Comparison Baseline
              </label>
              <select
                value={comparisonBaseline}
                onChange={(e) => setComparisonBaseline(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-slate-700 font-mono"
              >
                <option value="7_day_avg">7-Day Rolling Average</option>
                <option value="day_over_day">Day-over-Day (YoY)</option>
                <option value="mrr_target">Static MRR Threshold Target</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-850">
              <span className="text-xs text-slate-400 font-medium">Monitoring Stream</span>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition font-mono ${
                  notificationsEnabled 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-slate-800 text-slate-500 border border-slate-700"
                }`}
              >
                {notificationsEnabled ? "● RUNNING" : "○ PAUSED"}
              </button>
            </div>

            {/* Simulated Action */}
            <button
              onClick={handleSimulatePercentDrop}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold font-mono text-[10px] rounded-lg transition flex items-center justify-center gap-1.5 uppercase cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Simulate Percentage Drop Alert
            </button>
          </div>

          {/* List column */}
          <div className="lg:col-span-8 space-y-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono pb-2 border-b border-slate-850">
              Triggered Percentage Variance Alert Feed ({percentageAlerts.length})
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1.5 scrollbar-thin">
              <AnimatePresence initial={false}>
                {percentageAlerts.map((alert) => {
                  const isCritical = alert.severity === "Critical";
                  const isWarning = alert.severity === "Warning";
                  const isResolved = alert.status === "Resolved";

                  let cardBorder = "border-slate-850";
                  let badgeColor = "bg-slate-900 border-slate-800 text-slate-400";
                  
                  if (!isResolved) {
                    if (isCritical) {
                      cardBorder = "border-rose-950/60 bg-rose-950/5";
                      badgeColor = "bg-rose-500/10 border-rose-500/20 text-rose-400";
                    } else if (isWarning) {
                      cardBorder = "border-amber-950/60 bg-amber-950/5";
                      badgeColor = "bg-amber-500/10 border-amber-500/20 text-amber-400";
                    } else {
                      cardBorder = "border-sky-950/60 bg-sky-950/5";
                      badgeColor = "bg-sky-500/10 border-sky-500/20 text-sky-400";
                    }
                  } else {
                    cardBorder = "border-slate-850 bg-slate-950/20 opacity-70";
                  }

                  return (
                    <motion.div
                      key={alert.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.2 }}
                      className={`p-4 rounded-xl border ${cardBorder} transition-all space-y-3`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border font-mono ${badgeColor}`}>
                              {alert.severity}
                            </span>
                            
                            <span className="text-slate-400 text-xxs font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>

                            {isResolved && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
                                RESOLVED
                              </span>
                            )}
                          </div>

                          <h5 className="font-bold text-slate-200 text-xs flex items-center gap-1 font-headline mt-1.5">
                            {!isResolved && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block mr-1" />
                            )}
                            <TrendingDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            -{alert.percentageDrop}% Drop Triggered
                          </h5>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!isResolved && (
                            <button
                              onClick={() => handleResolvePercentAlert(alert.id)}
                              className="p-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-300 rounded hover:text-emerald-400 transition cursor-pointer"
                              title="Resolve Alert"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePercentAlert(alert.id)}
                            className="p-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-rose-400 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                        {alert.description}
                      </p>

                      {/* Numeric breakdown metric tags */}
                      <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-slate-900/40 border border-slate-850 text-xxs font-mono">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Ecosystem Value</span>
                          <span className="text-slate-200 font-bold">${alert.currentValue.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Comparison Base</span>
                          <span className="text-slate-300 font-semibold">${alert.baselineValue.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Percent Drop</span>
                          <span className="text-rose-400 font-extrabold flex items-center gap-0.5">
                            <ArrowDownRight className="w-3 h-3 text-rose-400" />
                            -{alert.percentageDrop}%
                          </span>
                        </div>
                      </div>

                      {alert.actionTaken && (
                        <div className="p-2.5 rounded bg-emerald-500/5 border border-emerald-500/10 space-y-1">
                          <div className="flex items-center gap-1 text-[9.5px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Resolution Protocol</span>
                          </div>
                          <p className="text-[10.5px] text-slate-300 font-sans italic">
                            "{alert.actionTaken}"
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {percentageAlerts.length === 0 && (
                  <div className="py-12 border border-dashed border-slate-850 rounded-xl text-center text-slate-500 text-xs font-mono">
                    No percentage drop alerts found.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
