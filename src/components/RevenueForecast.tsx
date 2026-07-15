/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import { 
  TrendingUp, 
  Coins, 
  Users, 
  Calendar, 
  Info, 
  ChevronRight, 
  Sliders, 
  DollarSign, 
  Sparkles,
  HelpCircle,
  HelpCircle as CheckCircle,
  ShieldAlert,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MetricSummary {
  grossEarnings: number;
  mrr: number;
  activeSubscriptions: number;
  conversionRate: number;
  totalPurchases: number;
  arpu: number;
}

interface RevenueForecastProps {
  metrics: MetricSummary;
}

interface ForecastPoint {
  monthIndex: number;
  monthLabel: string;
  date: Date;
  projectedMrr: number;
  projectedCumulative: number;
  projectedSubscribers: number;
}

export default function RevenueForecast({ metrics }: RevenueForecastProps) {
  // Configurable Projection Parameters
  const [timelineMonths, setTimelineMonths] = useState<number>(12);
  const [growthRatePercent, setGrowthRatePercent] = useState<number>(8.5); // Default MoM growth matching predictable MRR index conversion rate
  const [viewMetric, setViewMetric] = useState<"dual" | "mrr" | "cumulative">("dual");

  // Canvas Dimensions tracking (via ResizeObserver)
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 300 });

  // Mouse hover coordinate state for custom tooltip tracking
  const [activeDataPoint, setActiveDataPoint] = useState<ForecastPoint | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  // ResizeObserver registration
  useEffect(() => {
    if (!containerRef.current) return;

    let timer: NodeJS.Timeout;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      
      // Debounced updates for performance under active window resizes
      clearTimeout(timer);
      timer = setTimeout(() => {
        setDimensions({
          width: Math.max(width, 280),
          height: Math.max(height, 220)
        });
      }, 100);
    });

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  // Compute Forecast Data Array
  const baseMrr = metrics.mrr || 2150.00;
  const baseGross = metrics.grossEarnings || 14850.50;
  const baseSubs = metrics.activeSubscriptions || 112;
  const growthRateFactor = growthRatePercent / 100;

  const today = new Date();
  const allData: ForecastPoint[] = [];

  // Month 0 - Current Baseline
  const currentMonthLabel = today.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  allData.push({
    monthIndex: 0,
    monthLabel: currentMonthLabel,
    date: new Date(today.getFullYear(), today.getMonth(), 1),
    projectedMrr: baseMrr,
    projectedCumulative: baseGross,
    projectedSubscribers: baseSubs
  });

  // Calculate project intervals
  let rollingMrr = baseMrr;
  let rollingGross = baseGross;
  let rollingSubs = baseSubs;

  for (let i = 1; i <= timelineMonths; i++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const monthLabel = targetDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    
    rollingMrr = rollingMrr * (1 + growthRateFactor);
    rollingGross = rollingGross + rollingMrr;
    rollingSubs = Math.round(rollingSubs * (1 + growthRateFactor));

    allData.push({
      monthIndex: i,
      monthLabel,
      date: targetDate,
      projectedMrr: parseFloat(rollingMrr.toFixed(2)),
      projectedCumulative: parseFloat(rollingGross.toFixed(2)),
      projectedSubscribers: rollingSubs
    });
  }

  // Draw the D3 SVG layout directly
  useEffect(() => {
    if (!svgRef.current || allData.length === 0) return;

    const { width, height } = dimensions;
    const margin = { top: 25, right: 60, bottom: 40, left: 60 };
    const boundsWidth = width - margin.left - margin.right;
    const boundsHeight = height - margin.top - margin.bottom;

    if (boundsWidth <= 0 || boundsHeight <= 0) return;

    // Clear previous elements
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create primary group translation
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Ranges & Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(allData, d => d.date) as [Date, Date])
      .range([0, boundsWidth]);

    const mrrMax = d3.max(allData, d => d.projectedMrr) || baseMrr;
    const yScaleMrr = d3.scaleLinear()
      .domain([0, mrrMax * 1.15])
      .range([boundsHeight, 0]);

    const accumMax = d3.max(allData, d => d.projectedCumulative) || baseGross;
    const yScaleAccum = d3.scaleLinear()
      .domain([0, accumMax * 1.15])
      .range([boundsHeight, 0]);

    // Grid lines (yScaleMrr basis or yScaleAccum basis depending on selection)
    const primaryYScaleForGrid = viewMetric === "cumulative" ? yScaleAccum : yScaleMrr;
    g.append("g")
      .attr("class", "grid-lines")
      .selectAll("line")
      .data(primaryYScaleForGrid.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("y1", d => primaryYScaleForGrid(d))
      .attr("x2", boundsWidth)
      .attr("y2", d => primaryYScaleForGrid(d))
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "3,3");

    // Gradients defs
    const defs = svg.append("defs");
    
    // Indigo Purple Gradient (MRR Line)
    const mrrGrad = defs.append("linearGradient")
      .attr("id", "mrr-glow-gradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");
    mrrGrad.append("stop").attr("offset", "0%").attr("stop-color", "#a855f7").attr("stop-opacity", 0.35);
    mrrGrad.append("stop").attr("offset", "100%").attr("stop-color", "#a855f7").attr("stop-opacity", 0.0);

    // Cyan Blue Gradient (Cumulative Line)
    const accumGrad = defs.append("linearGradient")
      .attr("id", "accum-glow-gradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");
    accumGrad.append("stop").attr("offset", "0%").attr("stop-color", "#06b6d4").attr("stop-opacity", 0.35);
    accumGrad.append("stop").attr("offset", "100%").attr("stop-color", "#06b6d4").attr("stop-opacity", 0.0);

    // Bottom Time Axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.min(timelineMonths, 10))
      .tickFormat(d => d3.timeFormat("%b %y")(d as Date));

    g.append("g")
      .attr("transform", `translate(0, ${boundsHeight})`)
      .attr("class", "x-axis text-slate-500 font-mono")
      .call(xAxis)
      .call(g => g.select(".domain").attr("stroke", "#334155"))
      .call(g => g.selectAll(".tick line").attr("stroke", "#475569"))
      .call(g => g.selectAll(".tick text").attr("fill", "#94a3b8").attr("font-size", "10px").attr("dy", "10px"));

    // Left Axis (MRR) - Drawn if Dual or MRR selected
    if (viewMetric === "dual" || viewMetric === "mrr") {
      const leftAxis = d3.axisLeft(yScaleMrr)
        .ticks(5)
        .tickFormat(d => "$" + d3.format(".2s")(d));

      g.append("g")
        .attr("class", "y-axis-left text-slate-400 font-mono")
        .call(leftAxis)
        .call(g => g.select(".domain").attr("stroke", "none"))
        .call(g => g.selectAll(".tick line").attr("stroke", "#334155"))
        .call(g => g.selectAll(".tick text").attr("fill", "#c084fc").attr("font-size", "10px"));

      // MRR Area Fill
      const mrrAreaGenerator = d3.area<ForecastPoint>()
        .x(d => xScale(d.date))
        .y0(boundsHeight)
        .y1(d => yScaleMrr(d.projectedMrr))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(allData)
        .attr("class", "mrr-area")
        .attr("d", mrrAreaGenerator)
        .attr("fill", "url(#mrr-glow-gradient)");

      // MRR Line Path
      const mrrLineGenerator = d3.line<ForecastPoint>()
        .x(d => xScale(d.date))
        .y(d => yScaleMrr(d.projectedMrr))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(allData)
        .attr("class", "mrr-line")
        .attr("d", mrrLineGenerator)
        .attr("fill", "none")
        .attr("stroke", "#a855f7")
        .attr("stroke-width", 2.5);
    }

    // Right Axis (Cumulative) - Drawn if Dual or Cumulative selected
    if (viewMetric === "dual" || viewMetric === "cumulative") {
      const rightAxis = d3.axisRight(yScaleAccum)
        .ticks(5)
        .tickFormat(d => "$" + d3.format(".2s")(d));

      const axisGroup = g.append("g")
        .attr("transform", `translate(${boundsWidth}, 0)`)
        .attr("class", "y-axis-right text-slate-400 font-mono")
        .call(rightAxis)
        .call(g => g.select(".domain").attr("stroke", "none"))
        .call(g => g.selectAll(".tick line").attr("stroke", "#334155"))
        .call(g => g.selectAll(".tick text").attr("fill", "#22d3ee").attr("font-size", "10px"));

      // Cumulative Area Fill
      const accumAreaGenerator = d3.area<ForecastPoint>()
        .x(d => xScale(d.date))
        .y0(boundsHeight)
        .y1(d => yScaleAccum(d.projectedCumulative))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(allData)
        .attr("class", "cumulative-area")
        .attr("d", accumAreaGenerator)
        .attr("fill", "url(#accum-glow-gradient)");

      // Cumulative Line Path
      const accumLineGenerator = d3.line<ForecastPoint>()
        .x(d => xScale(d.date))
        .y(d => yScaleAccum(d.projectedCumulative))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(allData)
        .attr("class", "cumulative-line")
        .attr("d", accumLineGenerator)
        .attr("fill", "none")
        .attr("stroke", "#06b6d4")
        .attr("stroke-width", 2.5);
    }

    // Intersection trackdots
    const focusGroup = g.append("g")
      .attr("class", "interactive-focus")
      .style("display", "none");

    const verticalLine = focusGroup.append("line")
      .attr("stroke", "#475569")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4")
      .attr("y1", 0)
      .attr("y2", boundsHeight);

    const mrrMarker = focusGroup.append("circle")
      .attr("r", 5)
      .attr("fill", "#a855f7")
      .attr("stroke", "#090d16")
      .attr("stroke-width", 1.5);

    const accumMarker = focusGroup.append("circle")
      .attr("r", 5)
      .attr("fill", "#06b6d4")
      .attr("stroke", "#090d16")
      .attr("stroke-width", 1.5);

    // Interactive Overlay Panel for mouse detection
    const bisectDate = d3.bisector<ForecastPoint, Date>(d => d.date).center;

    svg.append("rect")
      .attr("class", "overlay-receptor")
      .attr("width", boundsWidth)
      .attr("height", boundsHeight)
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .attr("fill", "transparent")
      .style("pointer-events", "all")
      .on("mouseover", () => focusGroup.style("display", null))
      .on("mouseout", () => {
        focusGroup.style("display", "none");
        setActiveDataPoint(null);
        setHoverPosition(null);
      })
      .on("mousemove", function(event) {
        const [mouseX] = d3.pointer(event);
        const x0 = xScale.invert(mouseX);
        const idx = bisectDate(allData, x0, 1);
        const d0 = allData[idx - 1];
        const d1 = allData[idx];
        if (!d0 || !d1) return;
        const d = (x0.getTime() - d0.date.getTime()) > (d1.date.getTime() - x0.getTime()) ? d1 : d0;

        const xPos = xScale(d.date);
        focusGroup.attr("transform", `translate(${xPos}, 0)`);
        verticalLine.attr("y1", 0).attr("y2", boundsHeight);

        let tooltipY = 40;
        if (viewMetric === "dual" || viewMetric === "mrr") {
          const yMrr = yScaleMrr(d.projectedMrr);
          mrrMarker.attr("cy", yMrr).style("display", "block");
          tooltipY = yMrr;
        } else {
          mrrMarker.style("display", "none");
        }

        if (viewMetric === "dual" || viewMetric === "cumulative") {
          const yAccum = yScaleAccum(d.projectedCumulative);
          accumMarker.attr("cy", yAccum).style("display", "block");
          tooltipY = yAccum;
        } else {
          accumMarker.style("display", "none");
        }

        setActiveDataPoint(d);
        
        // Calculate page coordinates for custom floating HTML tooltip
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          setHoverPosition({
            x: rect.left + margin.left + xPos - 80,
            y: rect.top + margin.top + tooltipY - 110
          });
        }
      });

  }, [dimensions, viewMetric, timelineMonths, growthRatePercent, metrics]);

  // Terminal stats calculation
  const targetOutput = allData[allData.length - 1];
  const mrrIncreasePercent = parseFloat(((targetOutput.projectedMrr - baseMrr) / baseMrr * 100).toFixed(1));
  const cumulativeEarningsResult = targetOutput.projectedCumulative;

  // Handles exporting structured month-by-month prediction data into JSON file
  const handleExportJson = () => {
    const exportPayload = {
      generator: "AI-Agent-Hub Revenue Forecast Engine",
      generatedAt: new Date().toISOString(),
      parameters: {
        baselineMrr: baseMrr,
        baselineGross: baseGross,
        baselineActiveSubscribers: baseSubs,
        growthRateMoM: `${growthRatePercent}%`,
        projectionDurationMonths: timelineMonths
      },
      summaryMetrics: {
        projectedEndingMrr: targetOutput.projectedMrr,
        projectedEndingSubscribers: targetOutput.projectedSubscribers,
        projectedCumulativeGrossRun: cumulativeEarningsResult,
        netEcosystemGrossGrowth: parseFloat((cumulativeEarningsResult - baseGross).toFixed(2)),
        mrrOverallGrowthPercent: `${mrrIncreasePercent}%`
      },
      monthlyTimeline: allData.map(point => ({
        monthIndex: point.monthIndex,
        monthLabel: point.monthLabel,
        targetDate: point.date.toISOString().split('T')[0],
        projectedMrr: point.projectedMrr,
        projectedCumulative: point.projectedCumulative,
        projectedSubscribers: point.projectedSubscribers
      }))
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `revenue_forecast_${timelineMonths}m_${growthRatePercent.toFixed(1)}pct_mom.json`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6 font-sans">
      
      {/* Top Header Card Info Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-850 pb-5 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#a855f7]" />
            <h3 className="font-extrabold text-slate-100 text-sm tracking-wider uppercase font-mono">
              Workspace Revenue Forecast Model
            </h3>
            <span className="bg-purple-500/10 text-purple-400 font-mono text-[9px] px-2 py-0.5 rounded border border-purple-500/20 font-bold uppercase">
              D3.js Simulator Engine
            </span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
            Calculates predictable monthly compounding metrics and models cumulative revenue runs over time. Integrates current predictable MRR as of May 2026.
          </p>
        </div>

        {/* View toggling and JSON export button */}
        <div className="flex flex-wrap items-center gap-3 self-end md:self-auto select-none">
          <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-850">
            {[
              { id: "dual", label: "Dual Axis" },
              { id: "mrr", label: "MRR Curve" },
              { id: "cumulative", label: "Cumulative" }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setViewMetric(opt.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xxs font-bold uppercase tracking-wider transition-all duration-155 cursor-pointer ${
                  viewMetric === opt.id 
                    ? "bg-slate-800/80 text-white shadow" 
                    : "text-slate-500 hover:text-slate-350"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-850 hover:bg-slate-800 hover:text-purple-400 text-slate-400 text-xxs font-bold uppercase tracking-wider transition-all duration-155 cursor-pointer hover:border-purple-500/30 active:scale-95 duration-100"
            title="Export Month-by-Month Forecast to JSON"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Simulator Inputs Sliders (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#090d16]/30 p-4 border border-slate-850 rounded-2xl">
        
        {/* Slider 1: Monthly Growth */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              Monthly Growth Rate (MoM)
            </span>
            <span className="text-[#a855f7] font-black">{growthRatePercent.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="30.0"
            step="0.5"
            value={growthRatePercent}
            onChange={(e) => setGrowthRatePercent(parseFloat(e.target.value))}
            className="w-full accent-purple-500 h-1 cursor-pointer bg-slate-800 rounded-lg outline-none"
          />
          <div className="flex justify-between text-[9px] text-slate-550 font-mono">
            <span>1.0% Conservative</span>
            <span>8.5% Current Metric</span>
            <span>30.0% Aggressive</span>
          </div>
        </div>

        {/* Slider 2: Forecast timeline duration */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Projection Duration Timeline
            </span>
            <span className="text-[#06b6d4] font-black">{timelineMonths} Months</span>
          </div>
          <input
            type="range"
            min="6"
            max="24"
            step="2"
            value={timelineMonths}
            onChange={(e) => setTimelineMonths(parseInt(e.target.value))}
            className="w-full accent-cyan-500 h-1 cursor-pointer bg-slate-800 rounded-lg outline-none"
          />
          <div className="flex justify-between text-[9px] text-slate-550 font-mono">
            <span>6 Mths</span>
            <span>12 Mths (Default)</span>
            <span>24 Mths Horizon</span>
          </div>
        </div>

      </div>

      {/* Target forecast KPI Projection cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* KPI 1: Projected Ending MRR */}
        <div className="bg-slate-950 border border-slate-850 p-4.5 rounded-2xl space-y-1.5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Projected Ending MRR</span>
            <Coins className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-black text-slate-100 font-sans">
            ${targetOutput.projectedMrr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500 font-medium font-sans flex items-center gap-1">
            <span className="text-emerald-400 font-bold">+{mrrIncreasePercent}% growth</span> over current MRR basis.
          </p>
        </div>

        {/* KPI 2: Projected Cumulative Gross */}
        <div className="bg-slate-950 border border-slate-850 p-4.5 rounded-2xl space-y-1.5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Accumulative Gross run</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-slate-100 font-sans">
            ${cumulativeEarningsResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500 font-medium font-sans">
            Addition of <span className="text-slate-350 font-semibold">${(cumulativeEarningsResult - baseGross).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> new ecosystem gross margin.
          </p>
        </div>

        {/* KPI 3: Projected Active Customer nodes */}
        <div className="bg-slate-950 border border-slate-850 p-4.5 rounded-2xl space-y-1.5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Projected Subscriptions</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-slate-100 font-sans">
            {targetOutput.projectedSubscribers.toLocaleString()} Devs
          </div>
          <p className="text-[10px] text-slate-500 font-medium font-sans">
            Compounding <span className="text-emerald-400 font-bold">+{Math.max(0, targetOutput.projectedSubscribers - baseSubs)}</span> subscription licenses activated.
          </p>
        </div>

      </div>

      {/* Main D3 SVG canvas container */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-1 text-[10px] uppercase font-mono font-bold text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            <span>Projected Growth Timeline Run Chart</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono">
            {(viewMetric === "dual" || viewMetric === "mrr") && (
              <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#a855f7]"></span>
                Projected Monthly MRR
              </span>
            )}
            {(viewMetric === "dual" || viewMetric === "cumulative") && (
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#06b6d4]"></span>
                Projected Cumulative Gross
              </span>
            )}
          </div>
        </div>

        {/* Dynamic canvas wrapper */}
        <div 
          ref={containerRef} 
          className="relative w-full h-[260px] bg-[#0c1322]/40 rounded-2xl overflow-visible border border-slate-850 p-2"
        >
          <svg 
            ref={svgRef} 
            className="w-full h-full overflow-visible"
          />

          {/* D3-driven Floating Interactive HTML Tooltip */}
          {activeDataPoint && hoverPosition && (
            <div 
              className="absolute z-20 pointer-events-none bg-slate-950/95 border border-slate-750 p-3 rounded-xl shadow-lg space-y-1.5 shrink-0 max-w-xs font-sans text-left transition-all duration-75"
              style={{
                left: `${hoverPosition.x - (containerRef.current?.getBoundingClientRect().left || 0)}px`,
                top: `${hoverPosition.y - (containerRef.current?.getBoundingClientRect().top || 0)}px`,
              }}
            >
              <div className="text-[10px] font-black uppercase text-slate-400 font-mono border-b border-slate-850 pb-1 flex justify-between gap-4">
                <span>Month {activeDataPoint.monthIndex}:</span>
                <span className="text-white font-semibold">{activeDataPoint.monthLabel}</span>
              </div>
              
              <div className="space-y-1">
                {(viewMetric === "dual" || viewMetric === "mrr") && (
                  <div className="flex justify-between gap-6 text-[11px]">
                    <span className="text-slate-400 font-medium">Monthly MRR:</span>
                    <span className="text-purple-400 font-bold font-mono">
                      ${activeDataPoint.projectedMrr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                
                {(viewMetric === "dual" || viewMetric === "cumulative") && (
                  <div className="flex justify-between gap-6 text-[11px]">
                    <span className="text-slate-400 font-medium">Accumulative:</span>
                    <span className="text-cyan-400 font-bold font-mono">
                      ${activeDataPoint.projectedCumulative.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between gap-6 text-[11px]">
                  <span className="text-slate-400 font-medium">Active Subs:</span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    {activeDataPoint.projectedSubscribers} Devs
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <p className="text-[9.5px] text-slate-505 text-slate-500 font-mono text-center flex items-center justify-center gap-1 bg-slate-900/10 p-1 rounded-lg">
          <Info className="w-3 h-3 text-slate-400 shrink-0" />
          <span>Move cursor over the timeline grid to analyze exact computed balances at each interval node.</span>
        </p>
      </div>

      {/* Grid projection forecast breakdown intervals */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h4 className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            Forecast Iteration Breakdown Matrix
          </h4>
          <div className="flex items-center gap-3 text-[9px] font-mono select-none">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              High Growth (&gt;10%)
            </span>
            <span className="flex items-center gap-1 text-red-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              Stagnant Growth (&lt;2%)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-850 font-mono text-xxxs text-slate-350">
          <table className="w-full text-left text-[11px] divide-y divide-slate-850">
            <thead className="bg-[#0c1322] text-slate-400 font-bold uppercase">
              <tr>
                <th className="px-4 py-2.5 text-center font-sans">Interval</th>
                <th className="px-4 py-2.5 font-sans">Target Date</th>
                <th className="px-4 py-2.5 text-right font-sans">Projected MRR</th>
                <th className="px-4 py-2.5 text-right font-sans">cumulative Gross</th>
                <th className="px-4 py-2.5 text-center font-sans">Active Subscribers</th>
                <th className="px-4 py-2.5 text-right font-sans">MoM Growth Gain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 bg-slate-955/30">
              {allData.filter((_, idx) => idx % 2 === 0 || idx === 1 || idx === allData.length - 1).map((point, index) => {
                const prevPoint = point.monthIndex > 0 ? allData[point.monthIndex - 1] : null;
                const momGain = prevPoint ? point.projectedMrr - prevPoint.projectedMrr : 0;
                const growthPercent = prevPoint ? (momGain / prevPoint.projectedMrr) * 100 : 0;
                
                let rowClass = "hover:bg-slate-900/40 transition-colors duration-150";
                if (point.monthIndex > 0) {
                  if (growthPercent > 10) {
                    rowClass = "bg-emerald-950/20 hover:bg-emerald-900/10 border-l-2 border-emerald-500 transition-all duration-150 text-emerald-100";
                  } else if (growthPercent < 2) {
                    rowClass = "bg-red-950/20 hover:bg-red-900/10 border-l-2 border-red-500 transition-all duration-150 text-red-100";
                  }
                }

                return (
                  <tr key={index} className={rowClass}>
                    <td className="px-4 py-2 text-center text-slate-505 font-bold">+{point.monthIndex} M</td>
                    <td className="px-4 py-2 font-bold text-slate-300 font-sans">{point.monthLabel}</td>
                    <td className="px-4 py-2 text-right font-bold text-purple-400">${point.projectedMrr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2 text-right font-bold text-cyan-400">${point.projectedCumulative.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2 text-center text-slate-300">{point.projectedSubscribers} users</td>
                    <td className="px-4 py-2 text-right text-emerald-400 font-bold">
                      {momGain > 0 ? (
                        <div className="flex flex-col items-end leading-tight">
                          <span>+${momGain.toFixed(2)}</span>
                          <span className={`text-[9.5px] font-bold ${growthPercent > 10 ? 'text-emerald-400' : growthPercent < 2 ? 'text-red-400 font-semibold' : 'text-slate-450'}`}>
                            ({growthPercent.toFixed(1)}% MoM)
                          </span>
                        </div>
                      ) : "--"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
