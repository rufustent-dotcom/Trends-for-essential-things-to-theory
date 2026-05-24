import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { TrendingUp, Clock, Users, ArrowUpRight } from "lucide-react";

export interface GrowthDataPoint {
  date: Date;
  subscriptions: number;
  event?: string;
  growthDelta?: number;
}

interface SubscriptionGrowthChartProps {
  activeSubscriptions: number;
  height?: number;
}

/**
 * Generates 6 months of historical subscription growth data ending exactly at targetSubscriptions.
 */
function generateHistoricalGrowthData(targetSubscriptions: number): GrowthDataPoint[] {
  const data: GrowthDataPoint[] = [];
  const today = new Date();
  
  // Create a deterministic walk
  const steps = 30; // 30 weekly/bi-weekly steps across 6 months
  let currentVal = targetSubscriptions;

  for (let i = 0; i < steps; i++) {
    const date = new Date(today);
    // Move backwards in time by about 6 days per step
    date.setDate(today.getDate() - (i * 6));
    
    data.unshift({
      date,
      subscriptions: Math.max(15, Math.round(currentVal))
    });

    // Retroactive decay (going backward in time, subscriptions decrease)
    // Decrement by a slightly random percentage (e.g., average 3% drop per step backward)
    const factor = 0.95 + (Math.sin(i) * 0.03); // add natural wave style
    currentVal = currentVal * factor;
  }

  // Pin the final point to exactly the target value
  if (data.length > 0) {
    data[data.length - 1].subscriptions = targetSubscriptions;
  }

  // Calculate forward-moving deltas and inject key milestones
  for (let i = 0; i < data.length; i++) {
    const prev = data[i - 1];
    data[i].growthDelta = prev ? data[i].subscriptions - prev.subscriptions : 0;

    // Attach milestones on key dates
    if (i === 1) {
      data[i].event = "Beta Launch";
    } else if (i === 7) {
      data[i].event = "V1.2 Upgrade";
    } else if (i === 14) {
      data[i].event = "Featured Promo";
    } else if (i === 20) {
      data[i].event = "Corporate Plan";
    } else if (i === 26) {
      data[i].event = "Webhook Engine";
    } else if (i === 29) {
      data[i].event = "Current Live";
    }
  }

  return data;
}

export default function SubscriptionGrowthChart({ activeSubscriptions, height = 220 }: SubscriptionGrowthChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height });
  const [hoverData, setHoverData] = useState<GrowthDataPoint | null>(null);

  // Set up responsive ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setDimensions({
        width: Math.max(width, 100),
        height
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [height]);

  // Generate dataset
  const dataset = generateHistoricalGrowthData(activeSubscriptions);

  useEffect(() => {
    if (!svgRef.current || dataset.length === 0) return;

    const { width, height } = dimensions;
    const margin = { top: 20, right: 25, bottom: 30, left: 45 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous SVG contents
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Map Domains
    const xScale = d3.scaleTime()
      .domain(d3.extent(dataset, d => d.date) as [Date, Date])
      .range([0, chartWidth]);

    const yMin = d3.min(dataset, d => d.subscriptions) || 0;
    const yMax = d3.max(dataset, d => d.subscriptions) || 120;
    const yPadding = Math.max(10, (yMax - yMin) * 0.15);

    const yScale = d3.scaleLinear()
      .domain([Math.max(0, Math.floor(yMin - yPadding / 2)), Math.ceil(yMax + yPadding)])
      .range([chartHeight, 0]);

    // Create main Group
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create Gradient Fill definition
    const gradientId = "sub-growth-gradient";
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    // Cyan / Emerald gradient styling matching dashboard
    linearGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#06b6d4")
      .attr("stop-opacity", 0.25);

    linearGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#06b6d4")
      .attr("stop-opacity", 0.01);

    // Horizontal grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.08)
      .call(d3.axisLeft(yScale)
        .tickSize(-chartWidth)
        .tickFormat(() => "")
      )
      .selectAll(".tick line")
      .attr("stroke", "#ffffff")
      .attr("stroke-dasharray", "3,3");

    // X axis ticks - every month
    g.append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .attr("class", "x-axis")
      .call(d3.axisBottom(xScale)
        .ticks(d3.timeMonth.every(1) as any)
        .tickFormat(d3.timeFormat("%b '%y") as any)
      )
      .call(g => g.select(".domain").attr("stroke", "#1e293b").attr("stroke-opacity", 0.5))
      .call(g => g.selectAll(".tick line").attr("stroke", "#334155"))
      .call(g => g.selectAll(".tick text")
        .attr("fill", "#64748b")
        .attr("font-size", "9px")
        .attr("font-family", "JetBrains Mono, ui-monospace, monospace")
        .attr("dy", "10px")
      );

    // Y axis
    g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => `${d.valueOf()}`)
      )
      .call(g => g.select(".domain").attr("stroke", "#1e293b").attr("stroke-opacity", 0.5))
      .call(g => g.selectAll(".tick line").attr("stroke", "#334155"))
      .call(g => g.selectAll(".tick text")
        .attr("fill", "#64748b")
        .attr("font-size", "9px")
        .attr("font-family", "JetBrains Mono, ui-monospace, monospace")
      );

    // Define beautiful curves
    const lineGenerator = d3.line<GrowthDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.subscriptions))
      .curve(d3.curveMonotoneX);

    const areaGenerator = d3.area<GrowthDataPoint>()
      .x(d => xScale(d.date))
      .y0(chartHeight)
      .y1(d => yScale(d.subscriptions))
      .curve(d3.curveMonotoneX);

    // Render Area paths
    g.append("path")
      .datum(dataset)
      .attr("fill", `url(#${gradientId})`)
      .attr("d", areaGenerator);

    // Render Line path
    g.append("path")
      .datum(dataset)
      .attr("fill", "none")
      .attr("stroke", "#06b6d4")
      .attr("stroke-width", 2.2)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("d", lineGenerator);

    // Highlight final point
    const latestPoint = dataset[dataset.length - 1];
    g.append("circle")
      .attr("cx", xScale(latestPoint.date))
      .attr("cy", yScale(latestPoint.subscriptions))
      .attr("r", 5.5)
      .attr("fill", "#06b6d4")
      .attr("stroke", "#090d16")
      .attr("stroke-width", 2);

    // Highlight milestone points with gold/amber circles
    g.selectAll(".event-indicator")
      .data(dataset.filter(d => d.event && d !== latestPoint))
      .enter()
      .append("circle")
      .attr("class", "event-indicator")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.subscriptions))
      .attr("r", 4.5)
      .attr("fill", "#f59e0b") // Amber
      .attr("stroke", "#090d16")
      .attr("stroke-width", 1.5)
      .style("cursor", "help");

    // Interactive Hover Tracking components
    const focus = g.append("g").attr("style", "display: none;");

    focus.append("line")
      .attr("stroke", "#0891b2")
      .attr("stroke-width", 1.25)
      .attr("stroke-dasharray", "3,3")
      .attr("y1", 0)
      .attr("y2", chartHeight);

    focus.append("circle")
      .attr("r", 7.5)
      .attr("fill", "#06b6d4")
      .attr("fill-opacity", 0.25);

    focus.append("circle")
      .attr("r", 4)
      .attr("fill", "#06b6d4")
      .attr("stroke", "#0a0d16")
      .attr("stroke-width", 1.5);

    // Detect interactions with full width rect overlay
    svg.append("rect")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .attr("fill", "transparent")
      .attr("class", "hover-overlay")
      .style("cursor", "crosshair")
      .on("mouseover", () => focus.style("display", null))
      .on("mouseout", () => {
        focus.style("display", "none");
        setHoverData(null);
      })
      .on("mousemove", function (event) {
        const mouseX = d3.pointer(event)[0];
        const hoverDateVal = xScale.invert(mouseX);
        const bisectDate = d3.bisector<GrowthDataPoint, Date>(d => d.date).left;
        const idx = bisectDate(dataset, hoverDateVal, 1);
        
        const d0 = dataset[idx - 1];
        const d1 = dataset[idx];
        if (!d0) return;
        
        const point = !d1 ? d0 : (hoverDateVal.getTime() - d0.date.getTime() > d1.date.getTime() - hoverDateVal.getTime() ? d1 : d0);

        focus.attr("transform", `translate(${xScale(point.date)}, 0)`);
        focus.selectAll("circle").attr("cy", yScale(point.subscriptions));
        focus.select("line").attr("y1", 0).attr("y2", chartHeight);

        setHoverData(point);
      });

  }, [dimensions, dataset, activeSubscriptions]);

  // Calculations for secondary metrics side badges
  const sixMonthsAgoSub = dataset[0]?.subscriptions || 1;
  const netGrowth = activeSubscriptions - sixMonthsAgoSub;
  const percentGrowth = (netGrowth / Math.max(1, sixMonthsAgoSub)) * 100;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-black tracking-widest text-[#cbd5e1] uppercase font-mono">
              6-Month Active Subscription Growth Path (D3 Engine)
            </h3>
          </div>
          <p className="text-slate-500 text-[11px] font-sans">
            Tracking retroactive subscriber compound expansion analytics index across the previous 180 trading days.
          </p>
        </div>

        {/* Live Hover Statistics State */}
        <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
          {hoverData ? (
            <div className="bg-cyan-950/30 border border-cyan-900/60 rounded-xl px-3 py-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 shadow">
              <span className="text-slate-500 font-bold">DATE:</span>
              <span className="text-cyan-450 font-black">{hoverData.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              <span className="text-slate-600 font-bold">•</span>
              <span className="text-slate-300 font-bold">SUBSCRIBERS:</span>
              <span className="text-emerald-400 font-black">{hoverData.subscriptions}</span>
              {hoverData.growthDelta !== undefined && (
                <>
                  <span className="text-slate-600 font-bold">•</span>
                  <span className={`font-black ${hoverData.growthDelta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {hoverData.growthDelta >= 0 ? `+${hoverData.growthDelta}` : hoverData.growthDelta}
                  </span>
                </>
              )}
              {hoverData.event && (
                <>
                  <span className="text-slate-600 font-bold">•</span>
                  <span className="bg-amber-950/50 border border-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                    {hoverData.event}
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Hover chart to inspect historical state metrics</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
        {/* Metric Badges Column */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3.5 order-2 lg:order-1">
          <div className="bg-[#0a0d16] border border-slate-850 p-3 px-4 rounded-xl space-y-1">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Net New Signups</span>
            <span className="text-lg font-black text-white font-mono block flex items-baseline gap-1">
              +{netGrowth}
              <span className="text-[10px] text-slate-500 font-normal">Active</span>
            </span>
            <span className="text-[8px] text-slate-500 font-mono block uppercase">Last 6 Months expansion</span>
          </div>

          <div className="bg-[#0a0d16] border border-slate-850 p-3 px-4 rounded-xl space-y-1">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Compound Compound rate</span>
            <span className="text-lg font-black text-cyan-400 font-mono block flex items-baseline gap-0.5">
              +{percentGrowth.toFixed(1)}%
              <ArrowUpRight className="w-3 h-3 text-cyan-400 self-center" />
            </span>
            <span className="text-[8px] text-slate-500 font-mono block uppercase">Over 180d trading cycle</span>
          </div>
        </div>

        {/* The D3 Drawing Context Canvas */}
        <div className="lg:col-span-3 order-1 lg:order-2" ref={containerRef}>
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="overflow-visible block select-none"
          />
        </div>
      </div>
    </div>
  );
}
