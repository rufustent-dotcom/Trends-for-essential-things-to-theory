/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Activity, 
  Cpu, 
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
  Sliders, 
  Check, 
  ChevronRight, 
  Sparkles, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Download,
  Info,
  HelpCircle,
  FileText
} from "lucide-react";

import { 
  PatternNode, 
  SignalNode, 
  MapConnection, 
  initialPatterns, 
  initialSignals, 
  initialConnections 
} from "../data/patternsMapData";

interface PatternsSignalsMapProps {
  onSelectedNodeChange: (node: { type: "pattern" | "signal"; data: any } | null) => void;
  onMetricsUpdate?: (patternStrengthSupport: { [key: string]: number }) => void;
  stripeLogs?: any[];
}

export default function PatternsSignalsMap({ onSelectedNodeChange, onMetricsUpdate, stripeLogs }: PatternsSignalsMapProps) {
  // Primary States
  const [patterns, setPatterns] = useState<PatternNode[]>(initialPatterns);
  const [signals, setSignals] = useState<SignalNode[]>(initialSignals);
  const [connections, setConnections] = useState<MapConnection[]>(initialConnections);

  // Highlighting & Focus states
  const [hoveredNode, setHoveredNode] = useState<{ type: "pattern" | "signal"; id: string } | null>(null);
  const [selectedNode, setSelectedNode] = useState<{ type: "pattern" | "signal"; id: string } | null>(null);
  
  // Customization & Builder Hub States
  const [editMode, setEditMode] = useState(false);
  const [connectionDraftSource, setConnectionDraftSource] = useState<string | null>(null);
  const [showAddNodeModal, setShowAddNodeModal] = useState<false | "pattern" | "signal">(false);

  // New Node Inputs
  const [newNodeName, setNewNodeName] = useState("");
  const [newNodeDesc, setNewNodeDesc] = useState("");
  const [newNodeColor, setNewNodeColor] = useState("#8b5cf6");
  const [newNodeIcon, setNewNodeIcon] = useState<any>("Cpu");
  const [newSignalStage, setNewSignalStage] = useState("Acceleration");

  // Coordinates of node anchor points inside the joint SVG canvas
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ [key: string]: { x: number; y: number } }>({});

  // Recalculate positions on load/resize
  const updateCoords = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newCoords: typeof coords = {};

    patterns.forEach(p => {
      const el = document.getElementById(`anchor-p-${p.id}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        newCoords[`p-${p.id}`] = {
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top,
        };
      }
    });

    signals.forEach(s => {
      const el = document.getElementById(`anchor-s-${s.id}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        newCoords[`s-${s.id}`] = {
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top,
        };
      }
    });

    setCoords(newCoords);
  };

  useEffect(() => {
    // Initial and periodic update to handle expansion / timing
    const timer1 = setTimeout(updateCoords, 100);
    const timer2 = setTimeout(updateCoords, 500);

    window.addEventListener("resize", updateCoords);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", updateCoords);
    };
  }, [patterns, signals, connections]);

  // Generate connection support matrices for summary bars
  const patternStrengthMap = React.useMemo(() => {
    const strength: { [key: string]: number } = {};
    patterns.forEach(p => {
      const count = connections.filter(c => c.from === p.id || c.from === `p-${p.id}`).length;
      strength[p.id] = count;
    });
    return strength;
  }, [patterns, connections]);

  // Bubble up support matrix changes
  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate(patternStrengthMap);
    }
  }, [patternStrengthMap, onMetricsUpdate]);

  // Helper lists to map icons
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    Cpu: Cpu,
    Clock: Clock,
    Database: Database,
    Maximize: Maximize,
    Users: Users,
    Target: Target,
    Network: Network,
    MessageSquare: MessageSquare,
    Activity: Activity,
    Briefcase: Briefcase,
    Bot: Bot,
    Building: Building,
    Shield: Shield
  };

  const renderIcon = (name: string, className = "w-4 h-4") => {
    const Component = iconMap[name] || Cpu;
    return <Component className={className} />;
  };

  // Node selection triggers details sidebar update
  const handleNodeClick = (type: "pattern" | "signal", node: any) => {
    if (editMode) {
      if (type === "pattern") {
        setConnectionDraftSource(`p-${node.id}`);
      } else if (type === "signal" && connectionDraftSource) {
        // Toggle linkage between p-X and s-Y
        const fromId = connectionDraftSource;
        const toId = `s-${node.id}`;
        const matchIdx = connections.findIndex(c => c.from === fromId && c.to === toId);

        let nextConns = [...connections];
        if (matchIdx !== -1) {
          nextConns.splice(matchIdx, 1); // remove
        } else {
          nextConns.push({ from: fromId, to: toId, status: "strong" }); // add
        }
        setConnections(nextConns);
        setConnectionDraftSource(null);
      }
      return;
    }

    if (selectedNode?.type === type && selectedNode?.id === node.id) {
      setSelectedNode(null);
      onSelectedNodeChange(null);
    } else {
      setSelectedNode({ type, id: node.id });
      onSelectedNodeChange({ type, data: node });
    }
  };

  // Drag and drop or manual creation of new systems Nodes
  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName || !showAddNodeModal) return;

    if (showAddNodeModal === "pattern") {
      const newId = `p-custom-${Date.now()}`;
      const patNode: PatternNode = {
        id: newId,
        num: patterns.length + 1,
        name: newNodeName,
        observation: newNodeDesc || "Dynamic observation based on customer traffic.",
        implication: "Triggers downstream automation pipelines.",
        opportunity: "Unlocks predictive scaling algorithms.",
        color: newNodeColor,
        iconName: newNodeIcon as any
      };
      setPatterns([...patterns, patNode]);
    } else {
      const newId = `s-custom-${Date.now()}`;
      const sigNode: SignalNode = {
        id: newId,
        num: signals.length + 1,
        name: newNodeName,
        stage: `Custom Stage – ${newSignalStage}`,
        impactDots: ["medium", "medium", "low"],
        iconName: newNodeIcon as any
      };
      setSignals([...signals, sigNode]);
    }

    // Reset Form
    setNewNodeName("");
    setNewNodeDesc("");
    setNewNodeColor("#8b5cf6");
    setShowAddNodeModal(false);
    setTimeout(updateCoords, 200);
  };

  // Delete a customized Node
  const handleDeleteNode = (type: "pattern" | "signal", id: string) => {
    if (type === "pattern") {
      setPatterns(patterns.filter(p => p.id !== id));
      setConnections(connections.filter(c => c.from !== id && c.from !== `p-${id}`));
    } else {
      setSignals(signals.filter(s => s.id !== id));
      setConnections(connections.filter(c => c.to !== id && c.to !== `s-${id}`));
    }
    if (selectedNode?.id === id) {
      setSelectedNode(null);
      onSelectedNodeChange(null);
    }
    setTimeout(updateCoords, 200);
  };

  // Determine if a connection path is currently illuminated
  const getPathMatchStatus = (conn: MapConnection) => {
    const rawPId = conn.from.replace("p-", "");
    const rawSId = conn.to.replace("s-", "");

    if (!hoveredNode && !selectedNode) return "default";

    const focusType = hoveredNode?.type || selectedNode?.type;
    const focusId = hoveredNode?.id || selectedNode?.id;

    if (focusType === "pattern") {
      return focusId === rawPId ? "active" : "muted";
    }
    if (focusType === "signal") {
      return focusId === rawSId ? "active" : "muted";
    }
    return "default";
  };

  // Determine if a card itself is active/muted based on connection focus
  const getCardMatchStatus = (type: "pattern" | "signal", id: string) => {
    if (!hoveredNode && !selectedNode) return "default";

    const focusType = hoveredNode?.type || selectedNode?.type;
    const focusId = hoveredNode?.id || selectedNode?.id;

    if (focusType === type && focusId === id) return "focused";

    // Trace if it is connected to the focused element
    if (type === "pattern") {
      // Find connections from this pattern to the focused signal
      if (focusType === "signal") {
        const isConnected = connections.some(
          c => (c.from === id || c.from === `p-${id}`) && (c.to === focusId || c.to === `s-${focusId}`)
        );
        return isConnected ? "connected" : "dimmed";
      }
      return "dimmed";
    }

    if (type === "signal") {
      // Find connections to this signal from the focused pattern
      if (focusType === "pattern") {
        const isConnected = connections.some(
          c => (c.from === focusId || c.from === `p-${focusId}`) && (c.to === id || c.to === `s-${id}`)
        );
        return isConnected ? "connected" : "dimmed";
      }
      return "dimmed";
    }

    return "default";
  };

  return (
    <div className="space-y-6">
      
      {/* Settings / Controls Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-ping"></span>
            <span className="text-sm font-bold text-slate-100 tracking-tight">Interactive Layout Editor</span>
          </div>
          <p className="text-xs text-slate-400">
            Hover elements to reveal cause curves. Click cards to view details. Adjust the network topology below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
              editMode 
                ? "bg-purple-600 text-white border-purple-500 hover:bg-purple-700" 
                : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{editMode ? "Lock Layout Topology" : "Edit Connection Links"}</span>
          </button>

          <button
            onClick={() => setShowAddNodeModal("pattern")}
            className="bg-slate-800 text-slate-200 hover:bg-slate-750 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Pattern</span>
          </button>

          <button
            onClick={() => setShowAddNodeModal("signal")}
            className="bg-slate-800 text-slate-200 hover:bg-slate-750 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Signal</span>
          </button>
        </div>
      </div>

      {/* Editor Draft Warning indicator */}
      {editMode && (
        <div className="bg-purple-950/40 border border-purple-800 p-3 rounded-xl text-xs text-purple-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-400" />
            <span>
              {connectionDraftSource 
                ? "Step 2: Now click a Key Signal in the right column to toggle its connection path!" 
                : "Step 1: Click any Core Pattern in the left column map to select connection source..."}
            </span>
          </div>
          {connectionDraftSource && (
            <button 
              onClick={() => setConnectionDraftSource(null)}
              className="text-purple-400 underline font-mono text-xxs hover:text-white"
            >
              Reset Select
            </button>
          )}
        </div>
      )}

      {/* Map Interactive Columns Workspace Container */}
      <div 
        ref={containerRef}
        className="relative bg-[#070b13] border border-slate-800/80 rounded-2xl p-6 lg:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-4 overflow-hidden min-h-[750px] shadow-2xl"
        id="cause-signals-workspace"
      >
        {/* Subtle grid backdrop decoration */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none"></div>

        {/* Column 1: Core Patterns list (Left) - col-span-5 */}
        <div className="md:col-span-5 flex flex-col justify-between gap-4 z-10">
          <div className="border-b border-slate-800 pb-3 mb-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#a855f7] uppercase">Category Index</span>
              <h3 className="text-sm font-extrabold text-slate-100 tracking-tight uppercase">Core Patterns</h3>
            </div>
            <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-purple-950/40 border border-purple-800 text-purple-300 font-mono">
              {patterns.length} Frameworks
            </span>
          </div>

          <div className="space-y-4">
            {patterns.map((pat, idx) => {
              const matchState = getCardMatchStatus("pattern", pat.id);
              const cardBorder = selectedNode?.id === pat.id 
                ? "border-emerald-500 shadow-lg shadow-emerald-500/10"
                : editMode && connectionDraftSource === `p-${pat.id}`
                  ? "border-purple-400 shadow-md shadow-purple-500/20 animate-pulse"
                  : "border-slate-800 hover:border-slate-700";

              const cardOpacity = matchState === "dimmed" ? "opacity-[0.25]" : "opacity-100";
              const isCustom = pat.id.startsWith("p-custom");

              return (
                <div
                  key={pat.id}
                  onClick={() => handleNodeClick("pattern", pat)}
                  onMouseEnter={() => setHoveredNode({ type: "pattern", id: pat.id })}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`relative p-4.5 rounded-xl bg-slate-900/40 backdrop-blur-md border ${cardBorder} ${cardOpacity} cursor-pointer transition-all duration-300 select-none group`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Pattern Number Icon Shield */}
                    <div 
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white font-mono text-xs font-bold"
                      style={{ backgroundColor: pat.color, boxShadow: `0 4px 12px ${pat.color}35` }}
                    >
                      {idx + 1}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-headline font-bold text-slate-200 tracking-tight md:text-xs">
                          {pat.name}
                        </h4>
                        
                        {isCustom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNode("pattern", pat.id);
                            }}
                            className="p-1 rounded bg-slate-800 opacity-60 hover:opacity-100 hover:bg-slate-750 text-red-400 transition"
                            title="Delete custom pattern node"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-1 leading-snug">
                        <p className="text-[10px] text-slate-400 font-sans font-medium">
                          <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider block mb-0.5">Observation:</span>
                          {pat.observation}
                        </p>
                        <p className="text-[10px] text-slate-400 font-sans font-medium">
                          <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider block mb-0.5">Implication:</span>
                          {pat.implication}
                        </p>
                        <p className="text-[10px] text-emerald-400 font-sans font-medium">
                          <span className="text-emerald-600/80 font-mono text-[9px] uppercase tracking-wider block mb-0.5">Opportunity:</span>
                          {pat.opportunity}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SVG line source anchor dot */}
                  <div 
                    id={`anchor-p-${pat.id}`}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-slate-900 pointer-events-none transition-all"
                    style={{ backgroundColor: pat.color, marginRight: "-4px" }}
                  ></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Canvas (SVG overlay curves connecting Left -> Right) - col-span-2 */}
        <div className="hidden md:block md:col-span-2 pointer-events-none relative">
          {/* This spacer column is strictly covered by the absolute overlay canvas */}
        </div>

        {/* Column 3: Key Signals list (Right) - col-span-5 */}
        <div className="md:col-span-5 flex flex-col justify-between gap-4 z-10">
          <div className="border-b border-slate-800 pb-3 mb-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#06b6d4] uppercase">Signal Pulse</span>
              <h3 className="text-sm font-extrabold text-slate-100 tracking-tight uppercase">Key Signals</h3>
            </div>
            <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-800 text-cyan-300 font-mono">
              {signals.length} Active Nodes
            </span>
          </div>

          <div className="space-y-4">
            {signals.map((sig, idx) => {
              const matchState = getCardMatchStatus("signal", sig.id);
              const cardBorder = selectedNode?.id === sig.id 
                ? "border-emerald-500 shadow-lg shadow-emerald-500/10"
                : "border-slate-800 hover:border-slate-700";

              const cardOpacity = matchState === "dimmed" ? "opacity-[0.25]" : "opacity-100";
              const isCustom = sig.id.startsWith("s-custom");

              return (
                <div
                  key={sig.id}
                  onClick={() => handleNodeClick("signal", sig)}
                  onMouseEnter={() => setHoveredNode({ type: "signal", id: sig.id })}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`relative p-4.5 rounded-xl bg-slate-900/40 backdrop-blur-md border ${cardBorder} ${cardOpacity} cursor-pointer transition-all duration-300 select-none group`}
                >
                  {/* SVG line target anchor dot */}
                  <div 
                    id={`anchor-s-${sig.id}`}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-slate-900 pointer-events-none transition-all"
                    style={{ backgroundColor: "#06b6d4", marginLeft: "-4px" }}
                  ></div>

                  <div className="flex items-start gap-3.5">
                    {/* Signal icon placeholder */}
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-cyan-950/50 border border-cyan-800 text-cyan-400">
                      {renderIcon(sig.iconName, "w-4.5 h-4.5")}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded">
                            {idx + 1}
                          </span>
                          <h4 className="text-xs font-headline font-bold text-slate-100 truncate">
                            {sig.name}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isCustom && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNode("signal", sig.id);
                              }}
                              className="p-1 rounded bg-slate-800 opacity-60 hover:opacity-100 hover:bg-slate-750 text-red-400 transition"
                              title="Delete custom signal node"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 3 dots - Impact Rating */}
                          <div className="flex items-center gap-0.5" title="Impact level indices">
                            {sig.impactDots.map((dot, dIdx) => (
                              <span 
                                key={dIdx}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  dot === "high" 
                                    ? "bg-emerald-500" 
                                    : dot === "medium" 
                                      ? "bg-amber-500" 
                                      : "bg-blue-500"
                                }`}
                              ></span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-sans font-medium">
                          <span className="text-slate-500 font-mono text-[9px] uppercase block mb-0.5">Stage & Influence:</span>
                          {sig.stage}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global absolute Overlay SVG Canvas for connecting nodes via curved bezier paths */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none z-5 hidden md:block" 
          id="connections-svg-canvas"
        >
          <defs>
            {/* Ambient gradients to inject glowing lines */}
            <filter id="svg-glowing-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {connections.map((conn, cIdx) => {
            const pathNodeKey = conn.from;
            const signalNodeKey = conn.to;

            const pId = pathNodeKey.replace("p-", "");
            const patternObj = patterns.find(p => p.id === pId);
            const lineColor = patternObj ? patternObj.color : "#6366f1";

            const coordP = coords[pathNodeKey];
            const coordS = coords[signalNodeKey];

            if (!coordP || !coordS) return null;

            // Generate Cubic Bezier endpoints with center influence controls
            const cp1X = coordP.x + (coordS.x - coordP.x) * 0.4;
            const cp1Y = coordP.y;
            const cp2X = coordP.x + (coordS.x - coordP.x) * 0.6;
            const cp2Y = coordS.y;

            const dPath = `M ${coordP.x} ${coordP.y} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${coordS.x} ${coordS.y}`;

            // Check highlight state
            const state = getPathMatchStatus(conn);
            let strokeWidth = 1.25;
            let strokeOpacity = 0.25;
            let strokeDash = undefined;
            let filter = undefined;

            if (state === "active") {
              strokeWidth = 3;
              strokeOpacity = 0.95;
              filter = "url(#svg-glowing-glow)";
            } else if (state === "muted") {
              strokeWidth = 0.5;
              strokeOpacity = 0.04;
            } else if (state === "default") {
              strokeWidth = 1.5;
              strokeOpacity = 0.35;
            }

            return (
              <g key={cIdx}>
                {/* Visual Glow Layer */}
                {state === "active" && (
                  <path
                    d={dPath}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={strokeWidth + 5}
                    strokeOpacity={0.15}
                    filter={filter}
                  />
                )}

                {/* Core lines visual */}
                <path
                  d={dPath}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={strokeWidth}
                  strokeOpacity={strokeOpacity}
                  strokeDasharray={strokeDash}
                  className="transition-all duration-300"
                />
              </g>
            );
          })}
        </svg>

      </div>

      {/* Node creation modal overlay */}
      <AnimatePresence>
        {showAddNodeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <h4 className="font-bold text-slate-100 text-sm">
                    {showAddNodeModal === "pattern" ? "Construct Core Pattern" : "Construct Key Signal"}
                  </h4>
                </div>
                <button 
                  onClick={() => setShowAddNodeModal(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs font-mono"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddNode} className="space-y-4 font-sans text-xs">
                <div className="space-y-1">
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Node Label / Title</label>
                  <input
                    type="text"
                    value={newNodeName}
                    onChange={(e) => setNewNodeName(e.target.value)}
                    placeholder="e.g., Generative Speech Synthesizer"
                    required
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Strategic Impact Description</label>
                  <textarea
                    value={newNodeDesc}
                    onChange={(e) => setNewNodeDesc(e.target.value)}
                    placeholder="Describe how this affects infrastructure or speeds things up..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none resize-none"
                  />
                </div>

                {showAddNodeModal === "pattern" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Theme Accent Color</label>
                      <input
                        type="color"
                        value={newNodeColor}
                        onChange={(e) => setNewNodeColor(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-1 rounded-lg h-9 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Icon Node representation</label>
                      <select
                        value={newNodeIcon}
                        onChange={(e) => setNewNodeIcon(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-300 focus:outline-none"
                      >
                        <option value="Cpu">CPU Chip</option>
                        <option value="Clock">Clock</option>
                        <option value="Database">Database</option>
                        <option value="Maximize">Maximize</option>
                        <option value="Users">Users</option>
                        <option value="Target">Target</option>
                        <option value="Network">Network</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Adoption Stage</label>
                      <input
                        type="text"
                        value={newSignalStage}
                        onChange={(e) => setNewSignalStage(e.target.value)}
                        placeholder="e.g. Acceleration, Consolidation"
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Icon Node representation</label>
                      <select
                        value={newNodeIcon}
                        onChange={(e) => setNewNodeIcon(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-300 focus:outline-none"
                      >
                        <option value="MessageSquare">Speech Bubble</option>
                        <option value="Activity">Line Chart</option>
                        <option value="Cpu">Microchip</option>
                        <option value="Code">Braces / Code</option>
                        <option value="Briefcase">SaaS Briefcase</option>
                        <option value="Bot">Autonomous Bot</option>
                        <option value="Building">Enterprise Building</option>
                        <option value="Shield">Compliance Shield</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer text-center mt-2.5 text-xs uppercase"
                >
                  Inject Node into Maps
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
