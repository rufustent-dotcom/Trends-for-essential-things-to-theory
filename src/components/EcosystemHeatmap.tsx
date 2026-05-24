/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { 
  Flame, 
  TrendingUp, 
  Activity, 
  DollarSign, 
  Calendar, 
  HelpCircle,
  Sparkles,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeatmapDataPoint {
  year: number;
  monthIndex: number;
  monthLabel: string;
  velocity: number; // growth rate percentage (MoM)
  revenue: number;  // simulated revenue ($)
  events: number;   // active event count
  type: "actual" | "forecast";
}

// Predefined multi-year dataset demonstrating seasonal trends
const staticHeatmapData: HeatmapDataPoint[] = [
  // 2024 (Baseline year)
  { year: 2024, monthIndex: 0, monthLabel: "Jan", velocity: 11.2, revenue: 12500, events: 310, type: "actual" },
  { year: 2024, monthIndex: 1, monthLabel: "Feb", velocity: 13.5, revenue: 14100, events: 350, type: "actual" },
  { year: 2024, monthIndex: 2, monthLabel: "Mar", velocity: 10.1, revenue: 15500, events: 390, type: "actual" },
  { year: 2024, monthIndex: 3, monthLabel: "Apr", velocity: 8.4, revenue: 16800, events: 420, type: "actual" },
  { year: 2024, monthIndex: 4, monthLabel: "May", velocity: 7.9, revenue: 18100, events: 450, type: "actual" },
  { year: 2024, monthIndex: 5, monthLabel: "Jun", velocity: 4.8, revenue: 19000, events: 470, type: "actual" },
  { year: 2024, monthIndex: 6, monthLabel: "Jul", velocity: -1.2, revenue: 18700, events: 460, type: "actual" },
  { year: 2024, monthIndex: 7, monthLabel: "Aug", velocity: -2.8, revenue: 18100, events: 450, type: "actual" },
  { year: 2024, monthIndex: 8, monthLabel: "Sep", velocity: 5.2, revenue: 19100, events: 480, type: "actual" },
  { year: 2024, monthIndex: 9, monthLabel: "Oct", velocity: 14.1, revenue: 21800, events: 540, type: "actual" },
  { year: 2024, monthIndex: 10, monthLabel: "Nov", velocity: 22.4, revenue: 26700, events: 660, type: "actual" },
  { year: 2024, monthIndex: 11, monthLabel: "Dec", velocity: 28.1, revenue: 34200, events: 850, type: "actual" },

  // 2025 (Year of scale)
  { year: 2025, monthIndex: 0, monthLabel: "Jan", velocity: 12.8, revenue: 38500, events: 960, type: "actual" },
  { year: 2025, monthIndex: 1, monthLabel: "Feb", velocity: 14.0, revenue: 43900, events: 1100, type: "actual" },
  { year: 2025, monthIndex: 2, monthLabel: "Mar", velocity: 11.5, revenue: 48900, events: 1220, type: "actual" },
  { year: 2025, monthIndex: 3, monthLabel: "Apr", velocity: 9.1, revenue: 53300, events: 1330, type: "actual" },
  { year: 2025, monthIndex: 4, monthLabel: "May", velocity: 8.3, revenue: 57700, events: 1440, type: "actual" },
  { year: 2025, monthIndex: 5, monthLabel: "Jun", velocity: 5.0, revenue: 60600, events: 1515, type: "actual" },
  { year: 2025, monthIndex: 6, monthLabel: "Jul", velocity: -1.8, revenue: 59500, events: 1490, type: "actual" },
  { year: 2025, monthIndex: 7, monthLabel: "Aug", velocity: -3.5, revenue: 57400, events: 1435, type: "actual" },
  { year: 2025, monthIndex: 8, monthLabel: "Sep", velocity: 4.8, revenue: 60100, events: 1500, type: "actual" },
  { year: 2025, monthIndex: 9, monthLabel: "Oct", velocity: 15.6, revenue: 69500, events: 1740, type: "actual" },
  { year: 2025, monthIndex: 10, monthLabel: "Nov", velocity: 24.2, revenue: 86300, events: 2160, type: "actual" },
  { year: 2025, monthIndex: 11, monthLabel: "Dec", velocity: 29.5, revenue: 111800, events: 2800, type: "actual" },

  // 2026 (Current year - mixture of actuals & predictive modeling forecasts)
  { year: 2026, monthIndex: 0, monthLabel: "Jan", velocity: 14.5, revenue: 128000, events: 3200, type: "actual" },
  { year: 2026, monthIndex: 1, monthLabel: "Feb", velocity: 15.8, revenue: 148200, events: 3700, type: "actual" },
  { year: 2026, monthIndex: 2, monthLabel: "Mar", velocity: 12.1, revenue: 166100, events: 4150, type: "actual" },
  { year: 2026, monthIndex: 3, monthLabel: "Apr", velocity: 9.8, revenue: 182400, events: 4560, type: "actual" },
  { year: 2026, monthIndex: 4, monthLabel: "May", velocity: 8.5, revenue: 197900, events: 4945, type: "actual" }, // Current May 2026
  { year: 2026, monthIndex: 5, monthLabel: "Jun", velocity: 5.6, revenue: 209000, events: 5220, type: "forecast" },
  { year: 2026, monthIndex: 6, monthLabel: "Jul", velocity: -1.0, revenue: 206900, events: 5170, type: "forecast" },
  { year: 2026, monthIndex: 7, monthLabel: "Aug", velocity: -2.3, revenue: 202150, events: 5050, type: "forecast" },
  { year: 2026, monthIndex: 8, monthLabel: "Sep", velocity: 5.8, revenue: 213900, events: 5350, type: "forecast" },
  { year: 2026, monthIndex: 9, monthLabel: "Oct", velocity: 16.9, revenue: 250000, events: 6250, type: "forecast" },
  { year: 2026, monthIndex: 10, monthLabel: "Nov", velocity: 25.5, revenue: 313800, events: 7850, type: "forecast" },
  { year: 2026, monthIndex: 11, monthLabel: "Dec", velocity: 30.2, revenue: 408500, events: 10210, type: "forecast" }
];

export default function EcosystemHeatmap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Tab states for visualization types
  type MetricType = "velocity" | "revenue" | "events";
  const [activeMetric, setActiveMetric] = useState<MetricType>("velocity");
  const [selectedCell, setSelectedCell] = useState<HeatmapDataPoint | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 260 });
  
  // Custom Responsive Tracker using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        // Keep proportional aspect ratio bound
        const targetWidth = Math.max(width, 320);
        setDimensions({
          width: targetWidth,
          height: 240
        });
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Compute boundaries for color interpolation using D3
  const velocities = staticHeatmapData.map(d => d.velocity);
  const revenues = staticHeatmapData.map(d => d.revenue);
  const events = staticHeatmapData.map(d => d.events);

  // Velocity ranges from -4% to +32%
  const minVel = Math.min(...velocities);
  const maxVel = Math.max(...velocities);

  // Render heatmap cells using pure SVG but coordinate-calculated with D3 Scales
  const margin = { top: 35, right: 20, bottom: 40, left: 55 };
  const graphWidth = dimensions.width - margin.left - margin.right;
  const graphHeight = dimensions.height - margin.top - margin.bottom;

  // X Scale (Months Jan to Dec)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const xScale = d3.scaleBand()
    .domain(months)
    .range([0, graphWidth])
    .padding(0.08);

  // Y Scale (Years 2024, 2025, 2026)
  const years = [2024, 2025, 2026];
  const yScale = d3.scaleBand()
    .domain(years.map(String))
    .range([0, graphHeight])
    .padding(0.1);

  // Color functions based on metric selection
  const getColorForCell = (point: HeatmapDataPoint) => {
    if (activeMetric === "velocity") {
      const v = point.velocity;
      if (v < 0) {
        // Reddish decline for summer lull
        const t = Math.abs(v) / Math.abs(minVel || -1);
        return d3.interpolateRgb("#334155", "#ef4444")(t * 0.8);
      } else {
        // Purple/cyan/teal growth gradient
        const t = v / maxVel;
        if (t < 0.3) {
          return d3.interpolateRgb("#1e293b", "#5b21b6")(t / 0.3);
        } else if (t < 0.6) {
          return d3.interpolateRgb("#5b21b6", "#a855f7")((t - 0.3) / 0.3);
        } else {
          return d3.interpolateRgb("#a855f7", "#06b6d4")((t - 0.6) / 0.4);
        }
      }
    } else if (activeMetric === "revenue") {
      const maxRev = Math.max(...revenues);
      const t = point.revenue / maxRev;
      return d3.interpolateRgb("#0f172a", "#10b981")(t);
    } else {
      const maxEv = Math.max(...events);
      const t = point.events / maxEv;
      return d3.interpolateRgb("#0f172a", "#f59e0b")(t);
    }
  };

  const formattedValue = (point: HeatmapDataPoint) => {
    if (activeMetric === "velocity") {
      return `${point.velocity > 0 ? "+" : ""}${point.velocity.toFixed(1)}%`;
    } else if (activeMetric === "revenue") {
      return `$${(point.revenue / 1000).toFixed(1)}k`;
    } else {
      return point.events.toLocaleString();
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5 font-sans" id="seasonal-heatmap-d3">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-4">
        <div className="space-y-1">
          <h4 className="font-extrabold text-slate-105 text-sm uppercase tracking-wider font-mono flex items-center gap-2">
            <span className="p-1 px-1.5 rounded-md bg-purple-500/10 text-purple-400">
              <Flame className="w-4 h-4 animate-pulse inline" />
            </span>
            Ecosystem Monthly Heat-Map
          </h4>
          <p className="text-slate-450 text-[11px]">
            Analysis of seasonal expansion velocity and transactional spikes (2024 — 2026 actuals &amp; projections).
          </p>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-900/60 p-1 rounded-xl border border-slate-850">
          {[
            { id: "velocity", label: "Velocity MoM", icon: TrendingUp, color: "text-purple-400" },
            { id: "revenue", label: "Monthly Gross", icon: DollarSign, color: "text-emerald-400" },
            { id: "events", label: "API Events", icon: Activity, color: "text-amber-400" }
          ].map((type) => {
            const IconComponent = type.icon;
            const isActive = activeMetric === type.id;
            return (
              <button
                key={type.id}
                onClick={() => {
                  setActiveMetric(type.id as MetricType);
                  setSelectedCell(null);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xxs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  isActive 
                    ? "bg-slate-880 bg-slate-800/90 text-white shadow" 
                    : "text-slate-450 hover:text-slate-200"
                }`}
              >
                <IconComponent className={`w-3 h-3 ${isActive ? type.color : 'text-slate-500'}`} />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Heatmap Visualization */}
      <div ref={containerRef} className="relative w-full overflow-hidden select-none">
        <svg 
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="text-slate-400"
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Months Header Labels (X Axis Ticks) */}
            {months.map((m, index) => {
              const xPos = xScale(m);
              const cellWidth = xScale.bandwidth();
              if (xPos === undefined) return null;
              return (
                <text
                  key={m}
                  x={xPos + cellWidth / 2}
                  y={-10}
                  textAnchor="middle"
                  className="text-[9.5px] font-mono font-bold fill-slate-400"
                >
                  {m}
                </text>
              );
            })}

            {/* Years Row Labels (Y Axis Ticks) */}
            {years.map((y) => {
              const yPos = yScale(String(y));
              const cellHeight = yScale.bandwidth();
              if (yPos === undefined) return null;
              return (
                <text
                  key={y}
                  x={-12}
                  y={yPos + cellHeight / 2 + 3.5}
                  textAnchor="end"
                  className="text-[10px] font-mono font-extrabold fill-slate-300"
                >
                  {y}
                </text>
              );
            })}

            {/* Visual Cells Grid */}
            {staticHeatmapData.map((d) => {
              const xPos = xScale(d.monthLabel);
              const yPos = yScale(String(d.year));
              const cellWidth = xScale.bandwidth();
              const cellHeight = yScale.bandwidth();
              
              if (xPos === undefined || yPos === undefined) return null;
              
              const baseBg = getColorForCell(d);
              const isSelected = selectedCell && selectedCell.year === d.year && selectedCell.monthIndex === d.monthIndex;
              const isForecast = d.type === "forecast";
              
              return (
                <g key={`${d.year}-${d.monthIndex}`} className="cursor-pointer">
                  <rect
                    x={xPos}
                    y={yPos}
                    width={cellWidth}
                    height={cellHeight}
                    rx={3}
                    ry={3}
                    fill={baseBg}
                    stroke={isSelected ? "#ffffff" : isForecast ? "rgba(100, 116, 139, 0.25)" : "none"}
                    strokeWidth={isSelected ? 1.5 : 1}
                    strokeDasharray={isForecast ? "2 1" : "none"}
                    className="transition-all duration-150 hover:opacity-85"
                    onClick={() => setSelectedCell(d)}
                  />
                  
                  {/* Subtle indicator of prediction for future months */}
                  {isForecast && (
                    <circle 
                      cx={xPos + cellWidth - 4} 
                      cy={yPos + 4} 
                      r="1.5" 
                      fill="#cbd5e1" 
                      opacity="0.6" 
                    />
                  )}

                  {/* Cell Label (Only if enough width is available) */}
                  {dimensions.width > 520 && (
                    <text
                      x={xPos + cellWidth / 2}
                      y={yPos + cellHeight / 2 + 3.5}
                      textAnchor="middle"
                      className="text-[8px] font-mono font-bold pointer-events-none select-none fill-white/80"
                      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
                    >
                      {formattedValue(d)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Heatmap Legend and Hover State Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2 items-center">
        
        {/* Dynamic color scale Legend labels */}
        <div className="lg:col-span-6 space-y-2">
          <span className="text-[10px] font-mono font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
            Legend &amp; Color Threshold Map
          </span>
          
          <div className="flex items-center gap-3">
            {activeMetric === "velocity" ? (
              <div className="flex items-center gap-1.5 w-full max-w-[280px]">
                <div className="h-2 w-full rounded bg-gradient-to-r from-red-500 via-slate-800 to-cyan-400"></div>
                <div className="flex justify-between w-full text-[9px] font-mono text-slate-400 font-bold">
                  <span>-4% (Summer Lull)</span>
                  <span>+31% (Year End)</span>
                </div>
              </div>
            ) : activeMetric === "revenue" ? (
              <div className="flex items-center gap-1.5 w-full max-w-[280px]">
                <div className="h-2 w-full rounded bg-gradient-to-r from-slate-950 to-emerald-500"></div>
                <div className="flex justify-between w-full text-[9px] font-mono text-slate-400 font-bold">
                  <span>$12k</span>
                  <span>$408k</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 w-full max-w-[280px]">
                <div className="h-2 w-full rounded bg-gradient-to-r from-slate-950 to-amber-500"></div>
                <div className="flex justify-between w-full text-[9px] font-mono text-slate-400 font-bold">
                  <span>310 events</span>
                  <span>10,210 events</span>
                </div>
              </div>
            )}
            <span className="text-[9px] italic text-slate-500 shrink-0 font-mono flex items-center gap-0.5">
              <span className="inline-block w-2 h-2 rounded-full border border-slate-700 border-dashed mr-1"></span>
              dashed = forecast
            </span>
          </div>
        </div>

        {/* Informative detail readout panel */}
        <div className="lg:col-span-6">
          <AnimatePresence mode="wait">
            {selectedCell ? (
              <motion.div
                key={`info-${selectedCell.year}-${selectedCell.monthIndex}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-mono font-extrabold text-[11px] text-slate-100 uppercase">
                      {selectedCell.monthLabel} {selectedCell.year}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                      selectedCell.type === "actual" 
                        ? "bg-slate-800 text-slate-400" 
                        : "bg-purple-900/40 text-purple-300 border border-purple-800/30"
                    }`}>
                      {selectedCell.type}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedCell(null)}
                    className="text-[9px] text-slate-500 hover:text-slate-350 hover:underline font-mono"
                  >
                    Clear Select
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                    <div className="text-[8px] text-slate-500 uppercase font-mono font-black">MoM Velocity</div>
                    <div className="font-mono text-xs font-black text-purple-400">
                      {selectedCell.velocity > 0 ? "+" : ""}{selectedCell.velocity.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                    <div className="text-[8px] text-slate-500 uppercase font-mono font-black">Est Revenue</div>
                    <div className="font-mono text-xs font-black text-emerald-400">
                      ${selectedCell.revenue.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                    <div className="text-[8px] text-slate-500 uppercase font-mono font-black">API Requests</div>
                    <div className="font-mono text-xs font-black text-amber-500">
                      {selectedCell.events.toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-[#0f172a]/30 border border-slate-870 p-4 rounded-xl flex items-start gap-2.5 text-slate-400">
                <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10.5px] font-medium leading-relaxed font-sans">
                    <strong>Discovery Seasonal Cohort Insight:</strong> Note the clear Q3 summer lull (negative velocity cells in July/August) followed by a massive year-end Q4 surge as enterprises refresh their SaaS budget lines.
                  </p>
                  <p className="text-[9px] font-mono text-slate-505">
                    💡 Click any block cells in the heat-map above for target metrics and trend projections.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
