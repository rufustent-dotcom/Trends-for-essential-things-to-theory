/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  Search, 
  FileText, 
  CheckCircle, 
  ExternalLink, 
  ChevronRight, 
  Info, 
  Globe, 
  Building, 
  Users, 
  Terminal, 
  ShieldAlert, 
  Check, 
  Play, 
  HelpCircle,
  Clock,
  Layers,
  RefreshCw,
  Plus,
  Trash2,
  Percent
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import StockD3Chart from "./StockD3Chart";
import PortfolioD3Donut from "./PortfolioD3Donut";

interface Scenario {
  id: string;
  name: string;
  ticker: string;
  strategicFocus: string;
  integrations: string[];
}

const scenarios: Scenario[] = [
  {
    id: "nvda",
    name: "AI Powerhouse Deep Dive",
    ticker: "NVDA",
    strategicFocus: "Comprehensive analysis of business fundamentals, insider sentiment and AI-centric computing leadership.",
    integrations: ["get_stock_profile", "get_stock_insights", "get_stock_chart", "get_stock_holders"]
  },
  {
    id: "tsla",
    name: "Technical Setup Analysis",
    ticker: "TSLA",
    strategicFocus: "High-precision technical evaluation to identify key tradeable support and resistance price levels.",
    integrations: ["get_stock_chart", "get_stock_insights"]
  },
  {
    id: "comparative",
    name: "Big Tech Comparative",
    ticker: "AAPL vs MSFT vs GOOGL",
    strategicFocus: "Relative performance, momentum trends, and valuation benchmarking across primary technology giants.",
    integrations: ["get_stock_chart (comparisons)", "get_stock_insights"]
  },
  {
    id: "tencent",
    name: "International Markets",
    ticker: "0700.HK",
    strategicFocus: "Regional analysis utilizing localized Hong Kong market exchange parameters for offshore listings.",
    integrations: ["get_stock_profile", "get_stock_insights (region/lang)"]
  },
  {
    id: "amzn",
    name: "Due Diligence & Compliance",
    ticker: "AMZN",
    strategicFocus: "Regulatory audit of insider transactions and segment expansion ratios via SEC 10-Q/10-K filings.",
    integrations: ["get_stock_holders", "get_stock_sec_filing"]
  }
];

const mockPrompts = [
  {
    text: "Tell me about AAPL",
    scenarioId: "comparative",
    description: "Summarizes business profile and key financial insights for Apple Inc."
  },
  {
    text: "Is TSLA a good buy?",
    scenarioId: "tsla",
    description: "Evaluates technical outlook, key support/resistance levels, and analyst valuation."
  },
  {
    text: "Compare NVDA vs AMD",
    scenarioId: "nvda",
    description: "Generates comparative market capitalization metrics and parallel sector momentum."
  },
  {
    text: "Who is buying MSFT stock?",
    scenarioId: "comparative",
    description: "Lists latest institutional holdings, major inside buyers, and transaction schedules."
  },
  {
    text: "Show me AMZN's latest 10-K",
    scenarioId: "amzn",
    description: "Extracts primary segment profitability ratios directly from modern SEC submissions."
  }
];

interface PortfolioItem {
  ticker: string;
  name: string;
  shares: number;
  avgBuyPrice: number;
  currentPrice: number;
}

export default function StockAnalysisDemo() {
  const [activeSubTab, setActiveSubTab] = useState<"analysis" | "portfolio">("analysis");
  const [selectedScenario, setSelectedScenario] = useState<string>("nvda");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [userSearchText, setUserSearchText] = useState<string>("");
  const [simulating, setSimulating] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [simulatedOutput, setSimulatedOutput] = useState<any | null>(null);

  // My Portfolio states
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => {
    const cached = localStorage.getItem("manus_portfolio");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn("Could not parse cached portfolio stats.");
      }
    }
    return [
      { ticker: "NVDA", name: "NVIDIA Corp.", shares: 15, avgBuyPrice: 820.00, currentPrice: 935.40 },
      { ticker: "TSLA", name: "Tesla Inc.", shares: 20, avgBuyPrice: 185.00, currentPrice: 179.24 },
      { ticker: "AAPL", name: "Apple Inc.", shares: 10, avgBuyPrice: 170.00, currentPrice: 178.43 },
      { ticker: "MSFT", name: "Microsoft Corp.", shares: 12, avgBuyPrice: 410.00, currentPrice: 425.10 },
      { ticker: "GOOGL", name: "Alphabet Inc.", shares: 25, avgBuyPrice: 145.00, currentPrice: 152.88 }
    ];
  });

  // Save portfolio when updated
  useEffect(() => {
    localStorage.setItem("manus_portfolio", JSON.stringify(portfolio));
  }, [portfolio]);

  // Form states to add new positions
  const [addTicker, setAddTicker] = useState<string>("");
  const [addName, setAddName] = useState<string>("");
  const [addShares, setAddShares] = useState<string>("");
  const [addAvgBuyPrice, setAddAvgBuyPrice] = useState<string>("");
  const [addCurrentPrice, setAddCurrentPrice] = useState<string>("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<boolean>(false);

  // Add Asset Ticker into Portfolio state
  const handleAddPortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(false);

    if (!addTicker) {
      setAddError("Please specify an asset ticker symbol.");
      return;
    }

    const t = addTicker.trim().toUpperCase();
    const parsedShares = parseFloat(addShares);
    const parsedAvgCost = parseFloat(addAvgBuyPrice);
    const parsedCurrentPrice = parseFloat(addCurrentPrice);

    if (isNaN(parsedShares) || parsedShares <= 0) {
      setAddError("Specify a valid positive shares amount.");
      return;
    }
    if (isNaN(parsedAvgCost) || parsedAvgCost <= 0) {
      setAddError("Specify a valid positive average purchase price.");
      return;
    }
    if (isNaN(parsedCurrentPrice) || parsedCurrentPrice <= 0) {
      setAddError("Specify a valid positive current asset price.");
      return;
    }

    // Check if it already exists -> update it or append
    const existingIdx = portfolio.findIndex(item => item.ticker === t);
    if (existingIdx !== -1) {
      const updated = [...portfolio];
      const existing = updated[existingIdx];
      const totalShares = existing.shares + parsedShares;
      const weightedAvg = ((existing.shares * existing.avgBuyPrice) + (parsedShares * parsedAvgCost)) / totalShares;
      updated[existingIdx] = {
        ticker: t,
        name: addName.trim() || existing.name || `${t} Corp.`,
        shares: parseFloat(totalShares.toFixed(4)),
        avgBuyPrice: parseFloat(weightedAvg.toFixed(2)),
        currentPrice: parsedCurrentPrice
      };
      setPortfolio(updated);
    } else {
      setPortfolio(prev => [
        ...prev,
        {
          ticker: t,
          name: addName.trim() || `${t} Corp.`,
          shares: parsedShares,
          avgBuyPrice: parsedAvgCost,
          currentPrice: parsedCurrentPrice
        }
      ]);
    }

    // Clear and success message
    setAddTicker("");
    setAddName("");
    setAddShares("");
    setAddAvgBuyPrice("");
    setAddCurrentPrice("");
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 3000);
  };

  const handleRemovePortfolio = (ticker: string) => {
    setPortfolio(prev => prev.filter(item => item.ticker !== ticker));
  };

  // Search Grounding News states
  const [groundedNews, setGroundedNews] = useState<any | null>(null);
  const [loadingGrounding, setLoadingGrounding] = useState<boolean>(false);
  const [groundingError, setGroundingError] = useState<string | null>(null);
  const [activeGroundingTicker, setActiveGroundingTicker] = useState<string>("NVDA");
  const [isMockGrounding, setIsMockGrounding] = useState<boolean>(true);

  // News Grounding dynamic API fetcher
  const fetchGroundingNews = async (ticker: string) => {
    if (!ticker) return;
    const cleanTicker = ticker.toUpperCase().trim().match(/[A-Z0-9\.\-]{1,8}/)?.[0] || "NVDA";
    setActiveGroundingTicker(cleanTicker);
    setLoadingGrounding(true);
    setGroundingError(null);
    try {
      const response = await fetch("/api/stock/grounding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: cleanTicker })
      });
      const resData = await response.json();
      if (resData.success) {
        setGroundedNews(resData.data);
        setIsMockGrounding(!!resData.isMock);
      } else {
        setGroundingError(resData.errorMsg || "Failed to retrieve verified headlines.");
      }
    } catch (err: any) {
      setGroundingError("Network connectivity failure on stock intel pipeline.");
    } finally {
      setLoadingGrounding(false);
    }
  };

  // Synchronize report scenario select with news grounding panel
  useEffect(() => {
    let ticker = "NVDA";
    if (selectedScenario === "nvda") ticker = "NVDA";
    else if (selectedScenario === "tsla") ticker = "TSLA";
    else if (selectedScenario === "comparative") ticker = "AAPL";
    else if (selectedScenario === "tencent") ticker = "GOOGL";
    else if (selectedScenario === "amzn") ticker = "AMZN";
    
    fetchGroundingNews(ticker);
  }, [selectedScenario]);

  // Triggering the automated simulation for a command
  const handleExecutePrompt = (promptText: string, scenarioId: string) => {
    setCustomPrompt(promptText);
    setSimulating(true);
    setTerminalLogs([]);
    setSimulatedOutput(null);
    setSelectedScenario(scenarioId);

    // Dynamically trigger news grounding fetch if the prompt references standard tickers
    const qToken = promptText.toUpperCase();
    const tMatch = qToken.match(/\b(NVDA|TSLA|MSFT|META|AAPL|GOOGL|GOOG|NFLX|AMZN)\b/);
    if (tMatch) {
      fetchGroundingNews(tMatch[1]);
    } else if (scenarioId === "custom") {
      const generalMatch = qToken.match(/\b([A-Z]{2,6})\b/);
      if (generalMatch) {
        fetchGroundingNews(generalMatch[1]);
      }
    }

    const logs = [
      `Initializing wide parallel research worker context...`,
      `Invoking stock-analysis service model parameters for "${promptText}"...`,
      `Executing parallel fetch: querying SEC filings and market makers...`,
      `Resolving asset correlations and historical chart telemetry data...`,
      `Formatting strategic compliance audit matrices successfully.`
    ];

    let currentLogIdx = 0;
    const interval = setInterval(() => {
      if (currentLogIdx < logs.length) {
        setTerminalLogs(prev => [...prev, `[system-agent] ${logs[currentLogIdx]}`]);
        currentLogIdx++;
      } else {
        clearInterval(interval);
        setSimulating(false);
        // Build custom or scenario matching output
        if (scenarioId === "custom") {
          setSimulatedOutput(generateOutputForCustom(promptText));
        } else {
          setSimulatedOutput(generateOutputForScenario(scenarioId));
        }
      }
    }, 280);
  };

  const generateOutputForCustom = (prompt: string) => {
    const q = prompt.toLowerCase();
    
    // Check for OBV / Onstance trends
    if (q.includes("onstance") || q.includes("instance") || q.includes("obv") || q.includes("on balance") || q.includes("balance volume") || q.includes("on-balance")) {
      return {
        title: "On-Balance Volume (OBV) & Flow Accumulation (Onstance Momentum)",
        metrics: { price: "OBV Indicator: +14.2M Index", change: "Accumulation Divergence", cap: "Multi-Asset Composite", volume: "Accelerated" },
        bulletPoints: [
          "Divergence Tracking: Significant upward OBV trend confirms intensive institutional accumulation despite lateral price consolidated ranges.",
          "Trend Confirmation: OBV is currently breaking above its previous peak resist line, pointing to intermediate term bull setup confirmation.",
          "Flow Multiplier: Buy-side volume dominance ratios registered at +12.4% above historical 30-day moving averages.",
          "Indicator Instance: High-fidelity flow signals trace back to primary enterprise whale clusters (size tier 1 orders >= 5,000 lots)."
        ]
      };
    }
    
    // Check for standard ticker references
    if (q.includes("msft") || q.includes("microsoft")) {
      return {
        title: "Microsoft Corp. (MSFT) - Interactive Trend Analysis",
        metrics: { price: "$425.10", change: "+1.35%", cap: "$3.16T", volume: "21.8M" },
        bulletPoints: [
          "Azure & OpenAI Cloud: Cloud sector monetization trajectory accelerates through enterprise ChatGPT subscription volumes.",
          "Technicals Matrix: Key support thresholds established near $415.00, with short-term target breakthrough targets of $438.20.",
          "Ownership Structure: Sustained institutional demand, tracking at over 85% ownership density with stable retention indexes.",
          "Consensus Rating: Firmly designated as a 'Strong Buy' across key financial advisories and market makers."
        ]
      };
    }

    if (q.includes("meta") || q.includes("facebook")) {
      return {
        title: "Meta Platforms Inc. (META) - Interactive Trend Analysis",
        metrics: { price: "$475.20", change: "+2.84%", cap: "$1.21T", volume: "18.4M" },
        bulletPoints: [
          "Ad Scaling: AI-powered target matches trigger ad engagement boosts, driving visual conversion rates.",
          "Technicals Breakout: Setup points to immediate resistance testing near $480.00 bounds; next support sitting at $455.00.",
          "Operating Cash Flow: High free cash flow yield supports aggressive capital allocation and active stock buyback programs.",
          "Platform Core: Active user indicators suggest stable engagement metrics across core Facebook, Instagram, and Threads channels."
        ]
      };
    }

    if (q.includes("nflx") || q.includes("netflix")) {
      return {
        title: "Netflix Inc. (NFLX) - Interactive Trend Analysis",
        metrics: { price: "$610.15", change: "-0.45%", cap: "$264B", volume: "4.8M" },
        bulletPoints: [
          "Paid Sharing & Ads: Subscription gains continue growing, supported by monetization of shared accounts and expanding ad tiers.",
          "Support/Resistance: Main support channel holds around $595.00; resistance targets are capped near the $625.00 range limit.",
          "Program Leverage: Content production budgets are optimized while retaining market leading subscriber lock-in metrics.",
          "Forward Guidance: Operating margins are expected to exceed 24% for the upcoming quarterly cycle."
        ]
      };
    }

    if (q.includes("aapl") || q.includes("apple")) {
      return {
        title: "Apple Inc. (AAPL) - Interactive Trend Analysis",
        metrics: { price: "$178.43", change: "+0.15%", cap: "$2.75T", volume: "51.2M" },
        bulletPoints: [
          "On-Device AI Engine: Ramping next-gen mobile system-on-chips to trigger large-scale consumer handset upgrades.",
          "Technicals Bounds: Consolidated support detected near key historical level at $172.50; overhead resistance capped at $185.00.",
          "Financial Anchor: Premier cash flow profile acts as defensive support against high-interest macro variables.",
          "Consensus Recommendation: Holds a steady Outperform average target across retail and investment banking desks."
        ]
      };
    }

    if (q.includes("goog") || q.includes("google") || q.includes("alphabet")) {
      return {
        title: "Alphabet Inc. (GOOGL) - Interactive Trend Analysis",
        metrics: { price: "$152.88", change: "+0.85%", cap: "$1.91T", volume: "24.5M" },
        bulletPoints: [
          "Gemini Services: Developer API models licensing revenues expand, diversifying standard Google Search advertising models.",
          "Valuation Multiples: Trades at a significant forward P/E discount relative to immediate platform giants.",
          "Technicals Platform: Symmetrical triangle breakout signals short-term upward target path toward $158.50 key resistance.",
          "Growth Cap: Balanced infrastructure capital expenditures ensure optimal cash generation ratios."
        ]
      };
    }

    if (q.includes("nvda") || q.includes("nvidia")) {
      return {
        title: "NVIDIA Corp. (NVDA) - Dynamic Sector Scape",
        metrics: { price: "$935.40", change: "+4.12%", cap: "$2.34T", volume: "42.8M" },
        bulletPoints: [
          "Dominant enterprise GPU chipset pipeline secures massive pricing leverage and high barrier entry advantages.",
          "Volume momentum breakouts indicate robust demand across standard high-performance cloud server setups.",
          "Analyst price targets consolidate near $1,055.00 average, reflecting durable ecosystem lock-in.",
          "Insider holdings verify executive trust in long-term AI-compute hardware integration timetables."
        ]
      };
    }

    if (q.includes("tsla") || q.includes("tesla")) {
      return {
        title: "Tesla Inc. (TSLA) - Symmetrical Oscillations",
        metrics: { price: "$179.24", change: "-0.85%", cap: "$571B", volume: "84.2M" },
        bulletPoints: [
          "Evaluates technical outlook: testing historical intermediate support boundaries near $168.50 swing low.",
          "Overhead resistance ranges hold firmly near key threshold at $192.50 with low volume profiles.",
          "RSI records neutral 46.8, suggesting balanced sell-to-buy momentum for the active weekly weekly series.",
          "Retains solid valuation multiple premiums based on autopilot expansion scaling factors."
        ]
      };
    }

    // Default Fallback
    const matchedTicker = prompt.toUpperCase().match(/[A-Z\.\-]{2,6}/)?.[0] || "ASSET";
    return {
      title: `${matchedTicker} Custom Trend Scan & Strategic Overview`,
      metrics: { price: `$${(100 + Math.random() * 450).toFixed(2)}`, change: `${Math.random() > 0.45 ? "+" : "-"}${(Math.random() * 4.5).toFixed(2)}%`, cap: `$${(18 + Math.random() * 95).toFixed(1)}B`, volume: `${(1 + Math.random() * 12).toFixed(1)}M` },
      bulletPoints: [
        `Automated Scrape: Custom parameters mapped completed for "${prompt}". High-efficiency indicators checked.`,
        "Technicals Divergence: Standard oscillators suggest balanced trading momentum near recent high-density clusters.",
        "Flow Multipliers: Institutional liquidity signals indicate constructive accumulation profiles across core index weights.",
        "Trend Projection: Symmetrical trend channels are forming, indicating healthy forward consolidation characteristics."
      ]
    };
  };

  const generateOutputForScenario = (id: string) => {
    switch (id) {
      case "nvda":
        return {
          title: "NVIDIA Corp. (NVDA) - AI Powerhouse Deep Dive",
          metrics: { price: "$935.40", change: "+4.12%", cap: "$2.34T", volume: "42.8M" },
          bulletPoints: [
            "Undisputed global dominator in hyperscale AI computing chipsets and architecture.",
            "Short-term / intermediate technicals show strongly bullish patterns following volume breakthrough.",
            "Consolidated analyst targets project near-term upside target of $1,050.00 base.",
            "Major insider transactions indicate steady retention, aligning with multi-year hardware forecasts."
          ]
        };
      case "tsla":
        return {
          title: "Tesla Inc. (TSLA) - Technical Setup Levels",
          metrics: { price: "$179.24", change: "-0.85%", cap: "$571B", volume: "84.2M" },
          bulletPoints: [
            "Price currently testing intermediate support around historical 200-day moving average bounds.",
            "Tight overhead consolidation pattern suggests minor resistance levels around $192.50 key threshold.",
            "Relative Strength Index (RSI) is seated at neutral 46.8, demonstrating balanced momentum profiles.",
            "Sustains P/E valuation premium reflecting institutional trust in autonomous expansion roadmap."
          ]
        };
      case "comparative":
        return {
          title: "Big Technology Benchmarks (AAPL vs MSFT vs GOOGL)",
          metrics: { price: "Consolidated Basket", change: "Mixed Momentum", cap: "Combined ~$7.2T", volume: "Diverse Core" },
          bulletPoints: [
            "Microsoft (MSFT) exhibits strongest multi-sector momentum with immediate cloud enterprise AI integration.",
            "Apple (AAPL) remains highly defensive, characterized by clean balance sheet safety and share buyout velocity.",
            "Alphabet (GOOGL) presents a strong fundamental discount trading at low forward P/E targets relative to direct peers.",
            "Analyst consensus maintains steady buy recommendations for the absolute majority of this mega-cap layer."
          ]
        };
      case "tencent":
        return {
          title: "Tencent Holdings Ltd. (0700.HK) - Regional Market Insight",
          metrics: { price: "HK$ 382.40", change: "+1.95%", cap: "HK$ 3.59T", volume: "8.1M" },
          bulletPoints: [
            "Dominant market capitalization driver in Chinese fintech platforms, gaming systems, and social infrastructure.",
            "Regional regulatory parameters stabilized, creating solid grounds for valuation recovery cycles.",
            "Relative technical setup exhibits initial higher-low double bottom breakout patterns across HK Exchange bounds.",
            "Maintains high-fidelity dividend payout ratios keeping international investor backing active."
          ]
        };
      case "amzn":
        return {
          title: "Amazon.com Inc. (AMZN) - Compliance & Segment Expansion",
          metrics: { price: "$182.10", change: "+1.05%", cap: "$1.89T", volume: "31.5M" },
          bulletPoints: [
            "SEC Form 10-Q filing audits show strong AWS margin expansion, rising to 32.5% structural net yields.",
            "Periodic insider transactions represent regular 10b5-1 portfolio plans with no unannounced insider exits.",
            "E-commerce delivery operations cost optimizations continue reflecting structural warehouse robotic gains.",
            "No litigation red flags or structural accounting disparities in recent 8-K disclosures."
          ]
        };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="stock-analysis-skill-demo">
      
      {/* Intro Hero Section */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative space-y-4 max-w-4xl">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/40 text-xs font-bold text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block animate-pulse"></span>
              Skill Demonstration Live
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-xs font-bold text-purple-400">
              <Layers className="w-3.5 h-3.5" />
              Wide Research Parallel Engine
            </span>
          </div>

          <h2 className="text-2xl font-headline font-black text-white leading-tight">
            📊 Manus Stock Analysis Asset Intelligence Console
          </h2>
          <p className="text-slate-350 text-xs leading-relaxed max-w-3xl">
            Demonstrating our multi-asset fundamental and technical valuation pipeline. 
            By deploying structured micro-agent tasks in parallel, Manus bridges official filing audits, 
            trading momentum indicators, and regulatory insights into continuous operational intelligence.
          </p>
        </div>
      </div>

      {/* Sub-tab selection row */}
      <div className="flex border-b border-slate-900 px-1 gap-6 text-xxs font-mono uppercase tracking-widest font-black">
        <button
          onClick={() => setActiveSubTab("analysis")}
          className={`pb-2.5 relative cursor-pointer flex items-center gap-1.5 transition ${
            activeSubTab === "analysis" 
              ? "text-blue-400 font-extrabold select-active" 
              : "text-slate-550 hover:text-slate-355"
          }`}
        >
          <Activity className="w-4 h-4 text-blue-500/80" />
          <span>Market Intelligence &amp; AI Grounding</span>
          {activeSubTab === "analysis" && (
            <motion.div layoutId="subtab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("portfolio")}
          className={`pb-2.5 relative cursor-pointer flex items-center gap-1.5 transition ${
            activeSubTab === "portfolio" 
              ? "text-blue-400 font-extrabold select-active" 
              : "text-slate-550 hover:text-slate-355"
          }`}
        >
          <Briefcase className="w-4 h-4 text-purple-500/85" />
          <span>My Investment Portfolio</span>
          {activeSubTab === "portfolio" && (
            <motion.div layoutId="subtab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
          )}
        </button>
      </div>

      {activeSubTab === "analysis" ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Side: Interactive Scenario Selector & Dynamic Report Overview */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Main Scenarios Matrix Grid */}
          <div className="bg-slate-950 border border-slate-800/85 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black font-mono uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Evaluation Scenarios &amp; Methodologies
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xxs font-sans text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 font-mono text-[9px] uppercase tracking-widest">
                    <th className="pb-3 pl-2">Scenario Focus</th>
                    <th className="pb-3 text-center">Asset Core</th>
                    <th className="pb-3 hidden md:table-cell">Primary API Integrations</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 font-semibold">
                  {scenarios.map((sc) => {
                    const isActive = selectedScenario === sc.id;
                    return (
                      <tr 
                        key={sc.id}
                        onClick={() => {
                          setSelectedScenario(sc.id);
                          setSimulatedOutput(null);
                        }}
                        className={`hover:bg-slate-900/45 cursor-pointer transition ${
                          isActive ? 'bg-slate-900/50 text-white' : 'text-slate-400'
                        }`}
                      >
                        <td className="py-3.5 pl-2">
                          <div className="flex flex-col space-y-0.5 max-w-[280px] md:max-w-[340px]">
                            <span className={`text-[10.5px] font-bold ${isActive ? 'text-blue-400' : 'text-slate-200'}`}>
                              {sc.name}
                            </span>
                            <span className="text-[9.5px] text-slate-450 leading-relaxed font-normal">
                              {sc.strategicFocus}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 text-center font-mono text-[10px] font-black">
                          <span className={`px-2 py-0.5 rounded-md ${
                            isActive ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-900 text-slate-450'
                          }`}>
                            {sc.ticker}
                          </span>
                        </td>
                        <td className="py-3.5 hidden md:table-cell font-mono text-[9px] text-slate-500 max-w-[220px] truncate">
                          {sc.integrations.join(", ")}
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExecutePrompt(`Analyze ${sc.ticker} compliance & metrics`, sc.id);
                            }}
                            className={`p-1.5 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ml-auto cursor-pointer transition ${
                              isActive 
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow' 
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-350 border border-slate-800'
                            }`}
                          >
                            <Play className="w-2.5 h-2.5" />
                            <span>Simulate</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dynamic Scenario details output rendering */}
          <div className="bg-slate-950 border border-slate-800/85 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-xs font-black font-mono uppercase text-slate-300 tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Live Scenario Report Preview
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Live State: <strong className="text-emerald-400">Stable</strong>
              </span>
            </div>

            {/* Simulated interactive dashboards */}
            {selectedScenario === "nvda" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-white">NVIDIA Corp. (NVDA) - AI Deep Dive</h4>
                    <span className="text-[10px] text-slate-450 uppercase font-mono">Semiconductors &amp; High Performance Compute</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400 font-mono">$935.40</span>
                    <span className="block text-[10px] text-emerald-500 font-mono font-bold">+4.12% MoM</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850/60 text-center">
                    <span className="text-[8.5px] text-slate-500 font-mono uppercase block font-black">Market Cap</span>
                    <span className="text-xs font-mono font-black text-slate-200">$2.34 Trillion</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850/60 text-center">
                    <span className="text-[8.5px] text-slate-500 font-mono uppercase block font-black">Holders Consensus</span>
                    <span className="text-xs font-mono font-black text-purple-405 text-purple-400">92.4% Institutional</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850/60 text-center">
                    <span className="text-[8.5px] text-slate-500 font-mono uppercase block font-black">Insider Holding</span>
                    <span className="text-xs font-mono font-black text-amber-400">4.12% Founder Core</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850/60 text-center">
                    <span className="text-[8.5px] text-slate-500 font-mono uppercase block font-black">Technicals Outlook</span>
                    <span className="text-xs font-mono font-black text-emerald-405 text-emerald-400">Strong Bullish</span>
                  </div>
                </div>

                {/* NVDA D3 Chart */}
                <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-3">
                  <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-2 px-2">NVDA Price Momentum Trajectory (D3 Real-time Historical)</div>
                  <StockD3Chart ticker="NVDA" currentPrice={935.40} trend="bullish" height={130} />
                </div>

                <div className="space-y-2 text-xs leading-relaxed text-slate-350">
                  <p className="font-bold text-slate-100 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    Key Business &amp; Analyst Insight Points:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xxs">
                    <li>Hyperscale database procurement backlogs remain full for standard H200 and custom cloud AI architectures.</li>
                    <li>Sustains major pricing power over direct semiconductor peers, securing massive structural margins exceeding 75% gross.</li>
                    <li>Technical charts highlight immediate support at $875.00 level; breakthrough velocity targets $1,050.00 limits.</li>
                  </ul>
                </div>
              </div>
            )}

            {selectedScenario === "tsla" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-white">Tesla Inc. (TSLA) - Technical Setup Levels</h4>
                    <span className="text-[10px] text-slate-450 uppercase font-mono">Electric Mobility &amp; Full Self Driving Infrastructure</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-205 text-slate-200 font-mono">$179.24</span>
                    <span className="block text-[10px] text-amber-500 font-mono font-bold">-0.85% consolidation</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850/60 text-center">
                    <span className="text-[8.5px] text-slate-500 font-mono uppercase block font-black">Support Line</span>
                    <span className="text-xs font-mono font-black text-emerald-400">$168.50 Swing Low</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850/60 text-center">
                    <span className="text-[8.5px] text-slate-500 font-mono uppercase block font-black">Resistance Line</span>
                    <span className="text-xs font-mono font-black text-amber-400">$192.50 key cap</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850/60 text-center">
                    <span className="text-[8.5px] text-slate-500 font-mono uppercase block font-black">Relative RSI</span>
                    <span className="text-xs font-mono font-black text-purple-400">46.8 (Neutral)</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850/60 text-center">
                    <span className="text-[8.5px] text-slate-500 font-mono uppercase block font-black">Beta Velocity</span>
                    <span className="text-xs font-mono font-black text-red-400">High Volatility (1.62)</span>
                  </div>
                </div>

                {/* TSLA D3 Chart */}
                <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-3">
                  <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-2 px-2">TSLA Channel Oscillations (D3 Real-time Historical)</div>
                  <StockD3Chart ticker="TSLA" currentPrice={179.24} trend="bearish" height={130} />
                </div>

                <div className="space-y-2 text-xs leading-relaxed text-slate-350">
                  <p className="font-bold text-slate-100 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    Technical Analysis Insight:
                  </p>
                  <p className="text-slate-400 text-xxs font-sans leading-relaxed">
                    TSLA is trading within a tight symmetrical business consolidation range. Short-term downside appears limited near the $168 swing support; however, clear overhead volumes must cross $192.50 to validate a sustainable trend reversal.
                  </p>
                </div>
              </div>
            )}

            {selectedScenario === "comparative" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-white">Big Tech Benchmarks (AAPL vs MSFT vs GOOGL)</h4>
                    <span className="text-[10px] text-slate-450 uppercase font-mono">Consolidated Platform Monopolies Comparative</span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-900 rounded-xl">
                  <table className="w-full text-left text-xxs font-mono text-slate-300">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 text-[8.5px]">
                        <th className="py-2.5 pl-3">Asset Core</th>
                        <th className="py-2.5">Price</th>
                        <th className="py-2.5">Momentum YTD</th>
                        <th className="py-2.5">Forward P/E</th>
                        <th className="py-2.5 pr-2">Strategic Focus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60 font-semibold font-sans">
                      <tr className="hover:bg-slate-900/40 text-slate-205">
                        <td className="py-2.5 pl-3 font-mono font-extrabold text-blue-400">AAPL</td>
                        <td className="py-2.5 font-mono">$178.43</td>
                        <td className="py-2.5 text-emerald-400 font-bold font-mono">+6.42%</td>
                        <td className="py-2.5 font-mono">26.8x</td>
                        <td className="py-2.5 text-slate-400 pr-2">Defensive stability, premium cash cycles</td>
                      </tr>
                      <tr className="hover:bg-slate-900/40 text-slate-205">
                        <td className="py-2.5 pl-3 font-mono font-extrabold text-purple-400">MSFT</td>
                        <td className="py-2.5 font-mono">$425.10</td>
                        <td className="py-2.5 text-emerald-400 font-bold font-mono">+21.3%</td>
                        <td className="py-2.5 font-mono">34.2x</td>
                        <td className="py-2.5 text-slate-400 pr-2">Dominant AI enterprise cloud integration</td>
                      </tr>
                      <tr className="hover:bg-slate-900/40 text-slate-205">
                        <td className="py-2.5 pl-3 font-mono font-extrabold text-teal-400">GOOGL</td>
                        <td className="py-2.5 font-mono">$152.88</td>
                        <td className="py-2.5 text-emerald-400 font-bold font-mono">+12.8%</td>
                        <td className="py-2.5 font-mono">21.5x</td>
                        <td className="py-2.5 text-slate-400 pr-2">Low multiple search &amp; model monetization</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-1 text-xxs">
                  <div className="font-extrabold pb-0.5 text-indigo-400 uppercase tracking-widest font-mono text-[9px]">Market Valuation Outlook</div>
                  <p className="text-slate-400 font-sans leading-relaxed">
                    While MSFT commands a valuation premium reflecting fast AI acceleration curves, GOOGL represents a deep fundamental margin of safety proxy. AAPL operates as the defensive anchor of mega-cap baskets.
                  </p>
                </div>
              </div>
            )}

            {selectedScenario === "tencent" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-white">Tencent Holdings Ltd. (0700.HK) - International Analysis</h4>
                    <span className="text-[10px] text-slate-450 uppercase font-mono">Hong Kong Stock Exchange (SEHK) Core</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400 font-mono">HK$ 382.40</span>
                    <span className="block text-[10px] text-emerald-505 font-mono font-bold">+1.95%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-850/60 text-xxs font-semibold">
                  <div>
                    <span className="text-slate-500 font-mono uppercase block text-[8px] font-black mb-0.5">FX Currency</span>
                    <span className="text-slate-200 font-mono">HKD (Hong Kong Dollar)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono uppercase block text-[8px] font-black mb-0.5">Primary Sector</span>
                    <span className="text-slate-200">Interactive Media &amp; Gaming</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono uppercase block text-[8px] font-black mb-0.5">Ecosystem Driver</span>
                    <span className="text-slate-200">WeChat, Pay Platform, Cloud Core</span>
                  </div>
                </div>

                <div className="space-y-2 text-xxs text-slate-400">
                  <p className="text-slate-300 font-bold">International Asset Parameters:</p>
                  <p className="leading-relaxed">
                    Tencent represents the primary target of offshore technology investments within Hong Kong indices. With domestic game approvals returning to growth velocity and active monetization of digital transaction processing APIs, local margin compression trends are ending.
                  </p>
                </div>
              </div>
            )}

            {selectedScenario === "amzn" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-white">Amazon.com Inc. (AMZN) - Compliance Due Diligence</h4>
                    <span className="text-[10px] text-slate-450 uppercase font-mono">Official Regulatory Submission Audits</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-200 font-mono">$182.10</span>
                    <span className="block text-[10px] text-emerald-400 font-mono font-bold">+1.05%</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850/60 space-y-3 font-mono text-[9.5px]">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      SEC Filing Form 10-Q Verification
                    </span>
                    <span className="text-emerald-400 font-black">CLEAN COMPLIANCE</span>
                  </div>

                  <ul className="space-y-2 text-slate-300">
                    <li className="flex justify-between">
                      <span className="text-slate-500">AWS Operating Net Income Margin</span>
                      <span className="font-extrabold text-slate-100">32.5% (Up from 28.1% YoY)</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-500">Executive Insider Selling (10b5-1 Plan checks)</span>
                      <span className="text-amber-400">Pre-scheduled (No active sell alarms)</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-500">Litigation Exposure Score (Form 8-K audit)</span>
                      <span className="text-slate-400">Nominal / Historical average bounds</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3.5 bg-amber-950/20 border border-amber-900/30 rounded-xl flex items-start gap-2.5 text-xxs">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 font-sans">
                    <span className="font-bold text-slate-200 uppercase tracking-wider font-mono text-[9px] block">No Red Flags Spotted</span>
                    <p className="text-slate-400 leading-relaxed text-[10.5px]">
                      Our parallel filing auditor cross-checked Amazon's primary segment footnotes. Revenue structures remain strictly compliant with SEC regulation, with AWS maintaining solid defense channels.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedScenario === "custom" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-white">{simulatedOutput?.title || `Trend Scan: "${customPrompt || 'Active Indicator'}"`}</h4>
                    <span className="text-[10px] text-slate-450 uppercase font-mono">Dynamic AI &amp; Technical Trend Scraper Result</span>
                  </div>
                  {simulatedOutput && (
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-400 font-mono">{simulatedOutput.metrics.price}</span>
                      <span className="block text-[10px] text-emerald-500 font-mono font-bold">{simulatedOutput.metrics.change}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850/60 text-center">
                    <span className="text-[8.5px] text-slate-500 font-mono uppercase block font-black">Value / Benchmark</span>
                    <span className="text-xs font-mono font-black text-slate-200">{simulatedOutput?.metrics.price || "N/A"}</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850/60 text-center">
                    <span className="text-[8.5px] text-slate-500 font-mono uppercase block font-black">Capacity Base</span>
                    <span className="text-xs font-mono font-black text-purple-400">{simulatedOutput?.metrics.cap || "Calculating..."}</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850/60 text-center">
                    <span className="text-[8.5px] text-slate-500 font-mono uppercase block font-black">Volume Target</span>
                    <span className="text-xs font-mono font-black text-amber-405 text-amber-400">{simulatedOutput?.metrics.volume || "Sustained"}</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850/60 text-center">
                    <span className="text-[8.5px] text-slate-500 font-mono uppercase block font-black">Flow Status</span>
                    <span className="text-xs font-mono font-black text-emerald-400">Scan Complete</span>
                  </div>
                </div>

                {/* Custom D3 Chart */}
                <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-3">
                  <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-2 px-2">
                    Interactive Trend Deviation Curve ("{customPrompt || 'custom scan'}")
                  </div>
                  {(() => {
                    const numPrice = parseFloat(simulatedOutput?.metrics.price?.replace(/[^0-9\.]/g, "") || "100");
                    const trend = simulatedOutput?.metrics.change?.includes("+") ? "bullish" : "bearish";
                    return (
                      <StockD3Chart 
                        ticker={customPrompt?.toUpperCase() || "CUSTOM"} 
                        currentPrice={isNaN(numPrice) ? 150 : numPrice} 
                        trend={trend}
                        height={130} 
                      />
                    );
                  })()}
                </div>

                {simulatedOutput && (
                  <div className="space-y-2 text-xs leading-relaxed text-slate-350">
                    <p className="font-bold text-slate-100 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                      Audited Trend Milestones &amp; Insights:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-450 text-xxs leading-relaxed">
                      {simulatedOutput.bulletPoints.map((point: string, idx: number) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Real-time Google Search Grounding News Intelligence Panel */}
          <div className="bg-slate-950 border border-slate-800/85 rounded-2xl p-6 space-y-5 animate-fade-in" id="grounding-news-intelligence-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-4 font-sans">
              <div className="space-y-1">
                <span className="flex items-center gap-1 text-[8px] font-mono text-slate-500 font-extrabold uppercase tracking-widest leading-none">News Intel Layer</span>
                <h3 className="text-sm font-black font-headline text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                  Real-time Google Search Grounding News Feed
                </h3>
                <p className="text-[10px] text-slate-450 leading-relaxed max-w-lg">
                  Live indices pulling financial headlines from the past 24 hours via Google Search API for the chosen ticker.
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-1.5 self-start sm:self-center font-sans">
                <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black ${
                  loadingGrounding 
                    ? "bg-amber-950/40 border border-amber-800/30 text-amber-400"
                    : isMockGrounding
                      ? "bg-slate-900 border border-slate-800 text-slate-400"
                      : "bg-emerald-950/40 border border-emerald-800/40 text-emerald-400"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                    loadingGrounding
                      ? "bg-amber-400 animate-pulse"
                      : isMockGrounding
                        ? "bg-slate-500"
                        : "bg-emerald-400 animate-pulse"
                  }`}></span>
                  {loadingGrounding 
                    ? "POLLING LIVE WEB..." 
                    : isMockGrounding 
                      ? "SIMULATED GROUNDING" 
                      : "GOOGLE SEARCH CONNECTED"}
                </span>
              </div>
            </div>

            {/* Quick Ticker Switcher Buttons */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-900/40 p-2 rounded-xl border border-slate-900/80 font-sans">
              <span className="text-[9.5px] font-bold font-mono text-slate-500 uppercase px-2">Grounding Ticker:</span>
              {["NVDA", "TSLA", "MSFT", "META", "AAPL", "GOOGL", "NFLX", "AMZN"].map((tick) => {
                const isActive = activeGroundingTicker === tick;
                return (
                  <button
                    key={tick}
                    disabled={loadingGrounding}
                    onClick={() => fetchGroundingNews(tick)}
                    className={`px-2.5 py-1 text-xxs font-mono font-bold rounded-lg cursor-pointer transition ${
                      isActive 
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow font-black" 
                        : "bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800/60"
                    }`}
                  >
                    ${tick}
                  </button>
                );
              })}
            </div>

            {/* Grounded Content Display */}
            <div className="relative min-h-[160px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {loadingGrounding ? (
                  <motion.div 
                    key="grounding-loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center text-center py-10 space-y-3 font-sans"
                  >
                    <RefreshCw className="w-7 h-7 text-blue-405 text-blue-400 animate-spin" />
                    <div className="space-y-1">
                      <p className="text-[10.5px] font-mono text-slate-300 font-extrabold animate-pulse uppercase tracking-wider">
                        Resolving Search Grounding Nodes For ${activeGroundingTicker}...
                      </p>
                      <p className="text-[9px] text-slate-500 max-w-sm">
                        Assembling temporal queries, filtering news headlines, and calculating sentiment weights.
                      </p>
                    </div>
                  </motion.div>
                ) : groundingError ? (
                  <motion.div 
                    key="grounding-error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-4 bg-red-950/25 border border-red-950 rounded-xl font-sans"
                  >
                    <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                    <div className="space-y-0.5 text-left">
                      <span className="text-xxs font-extrabold font-mono text-red-400 uppercase tracking-wider block">Grounding Error</span>
                      <p className="text-xxxs text-slate-400 leading-relaxed font-sans">{groundingError}</p>
                    </div>
                  </motion.div>
                ) : groundedNews ? (
                  <motion.div 
                    key="grounding-success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5"
                  >
                    {/* AI Summary & Sentiment Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#0a0d16] border border-slate-905 border-slate-900 rounded-xl p-4 text-left">
                      {/* Left: Summary */}
                      <div className="md:col-span-3 space-y-2">
                        <div className="flex items-center gap-1.5 text-[9.5px] font-bold font-mono uppercase tracking-wider text-slate-400">
                          <Activity className="w-3.5 h-3.5 text-blue-400" />
                          AI Financial News Narrative
                        </div>
                        <p className="text-[10.5px] text-slate-300 font-sans leading-relaxed tracking-wide select-text">
                          "{groundedNews.summary}"
                        </p>
                      </div>

                      {/* Right: Score Gauge & Sentiment */}
                      <div className="divider md:border-l border-slate-900 md:pl-4 flex flex-col justify-center space-y-3 font-sans">
                        <div className="space-y-1 text-center md:text-left">
                          <span className="text-[8px] font-mono text-slate-500 uppercase block font-black">Consensus Sentiment</span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            groundedNews.marketSentiment === "Bullish"
                              ? "bg-emerald-950/60 border border-emerald-800/45 text-emerald-400"
                              : groundedNews.marketSentiment === "Bearish"
                                ? "bg-red-955/60 border border-red-800/45 text-red-400"
                                : "bg-slate-900 border border-slate-800 text-slate-300"
                          }`}>
                            {groundedNews.marketSentiment === "Bullish" ? (
                              <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
                            ) : groundedNews.marketSentiment === "Bearish" ? (
                              <TrendingDown className="w-3 h-3 text-red-500 shrink-0" />
                            ) : (
                              <Activity className="w-3 h-3 text-slate-450 shrink-0" />
                            )}
                            {groundedNews.marketSentiment}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 font-black uppercase">
                            <span>news impact index</span>
                            <span className="text-slate-300">{groundedNews.impactIndex}/100</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-500 ${
                                groundedNews.marketSentiment === "Bullish"
                                  ? "bg-emerald-400"
                                  : groundedNews.marketSentiment === "Bearish"
                                    ? "bg-red-400"
                                    : "bg-blue-400"
                              }`}
                              style={{ width: `${groundedNews.impactIndex}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Headline List */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-mono text-slate-500 font-black uppercase tracking-wider text-left px-1">
                        Recent 24-Hour Headlines Coverage ({groundedNews.news?.length || 0})
                      </div>

                      <div className="space-y-2.5">
                        {groundedNews.news?.map((newsItem: any, idx: number) => {
                          const isPos = newsItem.sentiment > 0.15;
                          const isNeg = newsItem.sentiment < -0.15;
                          return (
                            <div 
                              key={idx} 
                              className="bg-slate-900/35 hover:bg-slate-900/60 border border-slate-900/80 hover:border-slate-800/70 p-3.5 rounded-xl transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-left font-sans"
                            >
                              {/* Left Content */}
                              <div className="space-y-2 flex-grow max-w-2xl">
                                <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono select-none">
                                  {/* Event category tag */}
                                  <span className={`px-2 py-0.5 rounded text-[8.5px] uppercase font-black uppercase tracking-widest ${
                                    newsItem.category === "earnings" 
                                      ? "bg-purple-950/50 border border-purple-800/25 text-purple-400"
                                      : newsItem.category === "AI news"
                                        ? "bg-indigo-950/50 border border-indigo-800/25 text-indigo-400"
                                        : newsItem.category === "product launch"
                                          ? "bg-teal-950/50 border border-teal-800/25 text-teal-400"
                                          : newsItem.category === "regulation"
                                            ? "bg-amber-950/50 border border-amber-800/25 text-amber-400"
                                            : "bg-slate-900 border border-slate-850 text-slate-400"
                                  }`}>
                                    {newsItem.category}
                                  </span>

                                  {/* Sentiment tag */}
                                  <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide flex items-center gap-0.5 ${
                                    isPos
                                      ? "bg-emerald-950/40 text-emerald-400"
                                      : isNeg
                                        ? "bg-red-955/40 text-red-400"
                                        : "bg-slate-950 text-slate-450"
                                  }`}>
                                    {newsItem.sentiment > 0 ? "+" : ""}{newsItem.sentiment} Sentiment
                                  </span>
                                </div>

                                <a 
                                  href={newsItem.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[11px] font-sans font-bold text-slate-105 text-slate-100 hover:text-blue-400 hover:underline leading-relaxed block group/link"
                                >
                                  <span className="flex items-start gap-1 select-text">
                                    {newsItem.headline}
                                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover/link:text-blue-400 shrink-0 mt-0.5" />
                                  </span>
                                </a>

                                <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                                  <span>{newsItem.source}</span>
                                  <span>•</span>
                                  <span>{newsItem.time}</span>
                                </div>
                              </div>

                              {/* Right Data Indicators */}
                              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-slate-900/50 pt-2.5 md:pt-0 shrink-0">
                                <div className="text-right font-mono">
                                  <span className="text-[8px] text-slate-500 uppercase block">Credibility</span>
                                  <span className="text-[10.5px] font-extrabold text-slate-300">{newsItem.sourceCredibility}/10</span>
                                </div>
                                <div className="text-right font-mono">
                                  <span className="text-[8px] text-slate-500 uppercase block">Impact Score</span>
                                  <span className="text-[10.5px] font-extrabold text-slate-100">{newsItem.marketImpactScore}/100</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Grounding Verification Sources */}
                    {groundedNews.groundingReferences && groundedNews.groundingReferences.length > 0 && (
                      <div className="border-t border-slate-900/80 pt-4 space-y-2 text-left font-sans">
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black">
                          <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          Google News Search Grounding Sources (Verified Links)
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1 font-mono text-[9px] text-slate-400 select-text">
                          {groundedNews.groundingReferences.map((refItem: any, refIdx: number) => (
                            <a 
                              key={refIdx} 
                              href={refItem.uri} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-2.5 py-1 bg-[#101422] hover:bg-blue-950/40 border border-slate-850 rounded-lg hover:text-blue-400 flex items-center gap-1.5 transition"
                            >
                              <Globe className="w-2.5 h-2.5 text-blue-400" />
                              <span className="max-w-[180px] truncate">{refItem.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-10 space-y-2 text-slate-500 font-sans">
                    <Globe className="w-6 h-6 text-slate-700 animate-pulse" />
                    <span className="text-[9.5px]">Awaiting targeted grounding request...</span>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* Right Side: Interactive NLP Prompt Simulator */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Interactive sandbox commands executor */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div className="space-y-1">
              <h3 className="text-xs font-black font-mono uppercase text-slate-300 tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                Automated NLP Prompts Executor
              </h3>
              <p className="text-slate-450 text-[10.5px] leading-relaxed font-sans">
                Experience the stock-analysis skill workflows using mock natural language inputs or typing custom parameters below.
              </p>
            </div>

            {/* Custom Search Box & Quick Pills */}
            <div className="space-y-2 border-b border-slate-900 pb-4">
              <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 font-mono block">Dynamic Trend Scan Engine</label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-slate-500" />
                  </span>
                  <input
                    type="text"
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                    placeholder="Search e.g. onstance, OBV, MSFT, META..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3.5 text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleExecutePrompt(userSearchText || "onstance", "custom");
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  disabled={simulating}
                  onClick={() => handleExecutePrompt(userSearchText || "onstance", "custom")}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 rounded-xl cursor-pointer transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  <span>Scan</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {["onstance trend", "MSFT insights", "META setup", "NFLX support"].map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    disabled={simulating}
                    onClick={() => {
                      setUserSearchText(pill);
                      handleExecutePrompt(pill, "custom");
                    }}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 border border-slate-800/80 rounded text-[9px] text-slate-400 hover:text-slate-200 transition font-mono cursor-pointer disabled:opacity-50"
                  >
                    +{pill}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 font-mono block">Preset Scenario Evaluators</label>
              <div className="space-y-2 bg-slate-900/30 p-2 rounded-xl border border-slate-900/80">
                {mockPrompts.map((p, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setUserSearchText(p.text);
                      handleExecutePrompt(p.text, p.scenarioId);
                    }}
                    disabled={simulating}
                    className="w-full text-left p-2 rounded-lg border border-slate-850 bg-slate-950/80 hover:bg-slate-900 hover:border-slate-800 hover:text-white transition group flex items-start gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-xxs font-mono text-slate-300 font-extrabold group-hover:text-slate-100 block">
                        "{p.text}"
                      </span>
                      <span className="text-[9.5px] text-slate-500 font-sans block leading-snug">
                        {p.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Live Output Console */}
            <div className="bg-[#0b0e17] border border-slate-855 border-slate-900 rounded-xl p-3.5 min-h-[140px] flex flex-col justify-between font-mono text-[10px] relative">
              
              <AnimatePresence mode="wait">
                {simulating ? (
                  <motion.div 
                    key="sim-loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-1.5 py-4"
                  >
                    <div className="flex items-center gap-2 text-amber-405 font-bold mb-3 text-amber-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>MANUS PARALLEL RESEARCH IN PROGRESS...</span>
                    </div>
                    {terminalLogs.map((log, idx) => (
                      <div key={idx} className="text-slate-400 text-[9px] truncate">
                        {log}
                      </div>
                    ))}
                  </motion.div>
                ) : simulatedOutput ? (
                  <motion.div 
                    key="sim-result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 text-blue-400">
                      <span className="font-bold flex items-center gap-1 text-[9px]">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        RESEARCH COMPLETE
                      </span>
                      <span className="text-[8px] text-slate-500 font-black tracking-widest uppercase">wide matrix</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-100 font-bold block text-[11px] font-sans">
                        {simulatedOutput.title}
                      </span>
                      <div className="grid grid-cols-2 gap-2 py-1 select-text">
                        <div className="bg-slate-900 p-1 px-2 rounded">
                          <span className="text-[8px] text-slate-500 block">Value / Status</span>
                          <span className="font-extrabold text-slate-205">{simulatedOutput.metrics.price}</span>
                        </div>
                        <div className="bg-slate-900 p-1 px-2 rounded">
                          <span className="text-[8px] text-slate-500 block">Cap Base</span>
                          <span className="font-extrabold text-slate-205">{simulatedOutput.metrics.cap}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 font-sans text-xxs text-slate-450 leading-relaxed list-none">
                      {simulatedOutput.bulletPoints.map((point: string, i: number) => (
                        <div key={i} className="flex gap-1.5 items-start">
                          <span className="text-blue-400 shrink-0 select-none">•</span>
                          <p className="text-slate-350 text-[10.5px] leading-relaxed select-text">{point}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-8 space-y-2 text-slate-500">
                    <Terminal className="w-6 h-6 text-slate-700" />
                    <span className="text-[9.5px]">Awaiting simulated prompt execution...</span>
                  </div>
                )}
              </AnimatePresence>

            </div>
          </div>

          {/* Core explanation callout */}
          <div className="bg-[#0f172a]/20 border border-slate-850 p-4.5 rounded-2xl space-y-2.5">
            <h4 className="text-xxs font-extrabold font-mono text-purple-400 uppercase tracking-widest">About Parallel Wide Research</h4>
            <p className="text-slate-450 text-[10.5px] font-sans leading-relaxed">
              Standard stock valuation systems poll a single endpoint in sequential chains. 
              The Manus <strong>stock-analysis</strong> engine utilizes async orchestration hooks, 
              instantly spreading queries across international equity profiles, institutional 
              whale transaction ledgers, and direct government reporting centers simultaneously.
            </p>
          </div>

        </div>

      </div>
      ) : (
        <div className="space-y-6 animate-fade-in" id="portfolio-manager-dashboard">
          
          {(() => {
            const totalValue = portfolio.reduce((sum, item) => sum + (item.shares * item.currentPrice), 0);
            const totalCost = portfolio.reduce((sum, item) => sum + (item.shares * item.avgBuyPrice), 0);
            const totalProfit = totalValue - totalCost;
            const pctReturn = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
            const absoluteProfit = Math.abs(totalProfit);
            const isProfit = totalProfit >= 0;

            const donutData = portfolio.map((item) => ({
              ticker: item.ticker,
              value: item.shares * item.currentPrice
            })).filter(item => item.value > 0);

            return (
              <>
                {/* Metric Summary Ribbon Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Current Assets Valuation */}
                  <div className="bg-slate-950 border border-slate-900 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/8 transition-all pointer-events-none"></div>
                    <div>
                      <span className="text-slate-500 text-[9px] font-mono uppercase tracking-widest block font-bold">Total Portfolio Assets Value</span>
                      <span className="text-2xl font-black text-white font-mono mt-2 block">
                        ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 text-xxs text-slate-500 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                      <span>Refreshed live via D3 stream</span>
                    </div>
                  </div>

                  {/* Invested Principal Value */}
                  <div className="bg-slate-950 border border-slate-900 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div>
                      <span className="text-slate-500 text-[9px] font-mono uppercase tracking-widest block font-bold">Total Principal Invested</span>
                      <span className="text-2xl font-black text-slate-300 font-mono mt-2 block">
                        ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 text-xxs text-slate-500 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      <span>Sourced via multi-broker records</span>
                    </div>
                  </div>

                  {/* Net Profit & Loss return */}
                  <div className="bg-slate-950 border border-slate-900 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none ${isProfit ? "bg-emerald-500/5" : "bg-red-500/5"}`}></div>
                    <div>
                      <span className="text-slate-500 text-[9px] font-mono uppercase tracking-widest block font-bold">Unrealized Net Gain / Loss</span>
                      <span className={`text-2xl font-black font-mono mt-2 block flex items-baseline gap-1 ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                        {isProfit ? "+" : "-"}${absoluteProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3 font-mono text-xxs">
                      {isProfit ? (
                        <span className="flex items-center gap-0.5 text-emerald-400 font-bold">
                          <TrendingUp className="w-3.5 h-3.5" />
                          +{pctReturn.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-red-400 font-bold">
                          <TrendingDown className="w-3.5 h-3.5" />
                          {pctReturn.toFixed(2)}%
                        </span>
                      )}
                      <span className="text-slate-600 font-medium">Since inception</span>
                    </div>
                  </div>

                  {/* Tracked Count */}
                  <div className="bg-slate-950 border border-slate-900 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div>
                      <span className="text-slate-500 text-[9px] font-mono uppercase tracking-widest block font-bold">Assets &amp; Holdings Tracked</span>
                      <span className="text-2xl font-black text-white font-mono mt-2 block">
                        {portfolio.length} <span className="text-slate-500 text-xs font-normal">Active Tickers</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 text-xxs text-slate-500 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      <span>SEC regulatory status validated</span>
                    </div>
                  </div>

                </div>

                {/* Sub-tab grid layout panel columns */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Positions Inventory table */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Inventory Card Container */}
                    <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                        <h3 className="text-xs font-black font-mono uppercase text-slate-300 tracking-wider flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-blue-400" />
                          Portfolio Positions Inventory Ledger
                        </h3>
                        <span className="text-[9px] font-mono text-slate-500">
                          Active State: <strong className="text-emerald-400 font-bold uppercase">Cached Cloud Sync</strong>
                        </span>
                      </div>

                      {portfolio.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                          <Briefcase className="w-10 h-10 text-slate-800 mx-auto" />
                          <div className="space-y-1">
                            <span className="text-sm text-slate-300 font-bold block">No Assets Saved</span>
                            <span className="text-xxs text-slate-500 block max-w-md mx-auto leading-relaxed">
                              You have no assets registered inside this tracking node. Specify purchase properties below to instantly audit and evaluate your yields.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xxs font-sans text-slate-300 border-collapse">
                            <thead>
                              <tr className="border-b border-slate-900 text-slate-500 font-mono text-[9px] uppercase tracking-widest">
                                <th className="pb-3 pl-2">Asset Core</th>
                                <th className="pb-3 text-right">Shares</th>
                                <th className="pb-3 text-right">Avg Cost</th>
                                <th className="pb-3 text-right">Current Pt.</th>
                                <th className="pb-3 text-right">Market Value</th>
                                <th className="pb-3 text-right">Profit / Loss</th>
                                <th className="pb-3 pr-2 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/40 text-slate-205 font-medium">
                              {portfolio.map((item) => {
                                const mktVal = item.shares * item.currentPrice;
                                const costBasis = item.shares * item.avgBuyPrice;
                                const pl = mktVal - costBasis;
                                const plPct = costBasis > 0 ? (pl / costBasis) * 100 : 0;
                                const isPos = pl >= 0;

                                return (
                                  <tr key={item.ticker} className="hover:bg-slate-900/15 transition select-text">
                                    <td className="py-3.5 pl-2">
                                      <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-white font-mono">{item.ticker}</span>
                                        <span className="text-[9px] text-slate-500 font-normal truncate max-w-[140px]">{item.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-3.5 text-right font-mono text-[10px] text-slate-305 font-bold">
                                      {item.shares.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                                    </td>
                                    <td className="py-3.5 text-right font-mono text-[10px] text-slate-450">${item.avgBuyPrice.toFixed(2)}</td>
                                    <td className="py-3.5 text-right font-mono text-[10px] text-blue-400">${item.currentPrice.toFixed(2)}</td>
                                    <td className="py-3.5 text-right font-mono text-[10px] text-white font-black">
                                      ${mktVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className={`py-3.5 text-right font-mono text-[10px] font-bold ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                                      <span className="block">{isPos ? "+" : ""}${pl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      <span className="block text-[8px] font-medium">{isPos ? "+" : ""}{plPct.toFixed(2)}%</span>
                                    </td>
                                    <td className="py-3.5 pr-2 text-right select-none">
                                      <button
                                        onClick={() => handleRemovePortfolio(item.ticker)}
                                        className="p-1.5 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-red-900/60 hover:bg-red-950/20 text-slate-500 hover:text-red-400 transition cursor-pointer flex items-center justify-center ml-auto"
                                        title={`Delete ${item.ticker}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Entry position form block */}
                    <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-4">
                      <h3 className="text-xs font-black font-mono uppercase text-slate-350 tracking-wider flex items-center gap-2 border-b border-slate-900 pb-2.5">
                        <Plus className="w-4 h-4 text-emerald-505" />
                        Acquire Position / Add Custom Ticker
                      </h3>

                      <form onSubmit={handleAddPortfolio} className="space-y-4 font-sans text-xs">
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                          
                          <div className="space-y-1.5 col-span-2 lg:col-span-1">
                            <label className="text-[9px] font-mono text-slate-500 uppercase font-black block">Ticker</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. MSFT"
                              value={addTicker}
                              onChange={(e) => setAddTicker(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800/80 rounded-xl px-3 py-2 text-xxs text-white font-mono focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1.5 col-span-2 lg:col-span-1">
                            <label className="text-[9px] font-mono text-slate-500 uppercase font-black block">Company Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Microsoft Corp."
                              value={addName}
                              onChange={(e) => setAddName(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800/80 rounded-xl px-3 py-2 text-xxs text-slate-200 focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono text-slate-500 uppercase font-black block">Shares</label>
                            <input
                              type="number"
                              step="any"
                              required
                              placeholder="12"
                              value={addShares}
                              onChange={(e) => setAddShares(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800/80 rounded-xl px-3 py-2 text-xxs text-white font-mono focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono text-slate-500 uppercase font-black block">Avg Cost ($)</label>
                            <input
                              type="number"
                              step="any"
                              required
                              placeholder="410.00"
                              value={addAvgBuyPrice}
                              onChange={(e) => setAddAvgBuyPrice(e.target.value)}
                              className="w-full bg-[#090d16] border border-slate-800/80 rounded-xl px-3 py-2 text-xxs text-white font-mono focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono text-slate-500 uppercase font-black block">Current Price ($)</label>
                            <input
                              type="number"
                              step="any"
                              required
                              placeholder="425.10"
                              value={addCurrentPrice}
                              onChange={(e) => setAddCurrentPrice(e.target.value)}
                              className="w-full bg-[#090d16] border border-slate-800/80 rounded-xl px-3 py-2 text-xxs text-white font-mono focus:outline-none focus:border-blue-500"
                            />
                          </div>

                        </div>

                        <div className="flex items-center justify-between pt-1 gap-4">
                          <div className="text-[10px] leading-snug font-mono">
                            {addError && <span className="text-red-400 font-extrabold flex items-center gap-1">⚠️ {addError}</span>}
                            {addSuccess && <span className="text-emerald-400 font-extrabold flex items-center gap-1">✓ Assets added to offline persistent matrix!</span>}
                          </div>

                          <button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xxs tracking-wider px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 flex items-center gap-1.5 active:scale-[0.98]"
                          >
                            <Plus className="w-3.5 h-3.5 animate-pulse" />
                            <span>Save Asset Position</span>
                          </button>
                        </div>
                      </form>

                    </div>

                  </div>

                  {/* Right Column: D3 Donut Visualizer & Overall Growth trend charts */}
                  <div className="lg:col-span-4 space-y-6">
                    
                    {/* D3 Donut container */}
                    <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
                      <h3 className="text-xs font-black font-mono uppercase text-slate-350 tracking-wider flex items-center gap-2 border-b border-slate-900 pb-2">
                        <Percent className="w-3.5 h-3.5 text-indigo-400" />
                        Asset Contribution Weight (D3 Donut)
                      </h3>

                      {donutData.length === 0 ? (
                        <div className="text-center py-12 text-slate-600 font-mono text-xxs">Save assets to reveal allocation metrics.</div>
                      ) : (
                        <div className="space-y-4">
                          <PortfolioD3Donut data={donutData} height={190} />

                          {/* Legend lines */}
                          <div className="space-y-2 select-text">
                            {donutData.map((item, index) => {
                              const pct = (item.value / totalValue) * 100;
                              const colors = ["bg-[#10b981]", "bg-[#3b82f6]", "bg-[#818cf8]", "bg-[#a855f7]", "bg-[#06b6d4]", "bg-[#f59e0b]", "bg-[#ec4899]", "bg-[#14b8a6]"];
                              const colClass = colors[index % colors.length];
                              return (
                                <div key={item.ticker} className="flex items-center justify-between text-xxs font-mono text-slate-300">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${colClass}`}></span>
                                    <span className="font-bold text-slate-205">{item.ticker}</span>
                                  </div>
                                  <div className="text-slate-500 font-bold">
                                    <span className="text-slate-205">{pct.toFixed(1)}%</span>
                                    <span className="mx-1">/</span>
                                    <span>${item.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* D3 overall Performance chart */}
                    <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
                      <h3 className="text-xs font-black font-mono uppercase text-[#3b82f6] tracking-wider flex items-center gap-2 border-b border-slate-900 pb-2">
                        <Activity className="w-3.5 h-3.5 text-blue-400" />
                        Cumulative Valuation Path (D3 Engine)
                      </h3>
                      
                      <div className="space-y-3 font-sans text-xxs">
                        <p className="text-slate-450 leading-relaxed leading-snug">
                          Computed retroactive GBM random-walk performance path mapping assets index trajectory over the previous 30 trading days.
                        </p>
                        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-3">
                          <StockD3Chart 
                            ticker="PORTFOLIO" 
                            currentPrice={totalValue > 0 ? totalValue : 10000} 
                            height={130} 
                            trend={isProfit ? "bullish" : "bearish"} 
                          />
                        </div>
                        <div className="text-[9.5px] text-slate-500 font-mono text-right capitalize">
                          Scale mode: <strong className="text-blue-400">logarithmic Linear bounds</strong>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              </>
            );
          })()}

        </div>
      )}

    </div>
  );
}
