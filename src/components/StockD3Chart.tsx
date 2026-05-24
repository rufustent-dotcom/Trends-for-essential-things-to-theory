import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

export interface ChartDataPoint {
  date: Date;
  price: number;
}

interface StockD3ChartProps {
  ticker: string;
  currentPrice: number;
  trend?: "bullish" | "bearish" | "neutral";
  height?: number;
}

/**
 * Generates deterministic historical price data based on ticker and current price.
 * This ensures charts are beautiful, consistent, and look exactly like real assets.
 */
function generateHistoricalPriceData(ticker: string, targetPrice: number, days = 30): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const today = new Date();
  
  // Make a simple deterministic seed based on ticker name
  let seed = 0;
  for (let i = 0; i < ticker.length; i++) {
    seed += ticker.charCodeAt(i) * (i + 1);
  }
  
  const random = () => {
    // LCG pseudo-random number generator
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // Determine standard volatility and drift
  let volatility = 0.015; // 1.5% daily standard
  let drift = 0.001; // slight positive baseline
  
  if (ticker === "NVDA" || ticker === "MSFT") {
    drift = 0.003; // strong bullish
    volatility = 0.02;
  } else if (ticker === "TSLA") {
    drift = -0.001; // consolidating / bearish
    volatility = 0.025;
  } else if (ticker === "0700.HK" || ticker === "Tencent") {
    drift = 0.0015;
    volatility = 0.012;
  }

  let price = targetPrice;
  
  // Walk backwards in time
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Day of week check (exclude weekends for realistic stock charts)
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }

    data.unshift({ date, price: parseFloat(price.toFixed(2)) });
    
    // Simulate reverse GBM logic (going backwards means we inverse the daily change pattern)
    const changePercent = (random() - 0.5 + drift) * volatility;
    price = price / (1 + changePercent);
  }

  // Ensure the final data point is exactly our target currentprice
  if (data.length > 0) {
    data[data.length - 1].price = targetPrice;
  }

  return data;
}

export default function StockD3Chart({ ticker, currentPrice, trend = "neutral", height = 180 }: StockD3ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height });
  const [hoverData, setHoverData] = useState<ChartDataPoint | null>(null);

  // Set up responsive ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setDimensions({
        width: Math.max(width, 100), // Prevent 0 width failures
        height
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [height]);

  // Generate dataset
  const dataset = generateHistoricalPriceData(ticker, currentPrice);

  useEffect(() => {
    if (!svgRef.current || dataset.length === 0) return;

    const { width, height } = dimensions;
    const margin = { top: 15, right: 15, bottom: 25, left: 45 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous elements
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Map domains
    const xScale = d3.scaleTime()
      .domain(d3.extent(dataset, d => d.date) as [Date, Date])
      .range([0, chartWidth]);

    const yMin = d3.min(dataset, d => d.price) || 0;
    const yMax = d3.max(dataset, d => d.price) || 100;
    const yPadding = (yMax - yMin) * 0.08 || 5; // offset margins so curve never touches borders

    const yScale = d3.scaleLinear()
      .domain([Math.max(0, yMin - yPadding), yMax + yPadding])
      .range([chartHeight, 0]);

    // Create Main Group
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create Gradient Fill Definition
    const gradientId = `chart-fade-${ticker.replace(/[^a-zA-Z]/g, "")}`;
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    // Color theme matching trend
    const strokeColor = trend === "bullish" 
      ? "#10b981" 
      : trend === "bearish" 
        ? "#ef4444" 
        : "#3b82f6"; // standard blue for neutral

    linearGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", strokeColor)
      .attr("stop-opacity", 0.22);

    linearGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", strokeColor)
      .attr("stop-opacity", 0.01);

    // Grid lines - horizontal
    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.07)
      .call(d3.axisLeft(yScale)
        .tickSize(-chartWidth)
        .tickFormat(() => "")
      )
      .selectAll(".tick line")
      .attr("stroke", "#ffffff")
      .attr("stroke-dasharray", "3,3");

    // Grid lines - vertical (fewer)
    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.04)
      .call(d3.axisBottom(xScale)
        .ticks(5)
        .tickSize(chartHeight)
        .tickFormat(() => "")
      )
      .selectAll(".tick line")
      .attr("stroke", "#ffffff");

    // X-Axis
    g.append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .attr("class", "x-axis")
      .call(d3.axisBottom(xScale)
        .ticks(Math.min(width / 75, 6))
        .tickFormat(d3.timeFormat("%b %d") as any)
      )
      .call(g => g.select(".domain").attr("stroke", "#1e293b").attr("stroke-opacity", 0.4))
      .call(g => g.selectAll(".tick line").attr("stroke", "#334155"))
      .call(g => g.selectAll(".tick text").attr("fill", "#64748b").attr("font-size", "8.5px").attr("font-family", "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"));

    // Y-Axis
    g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale)
        .ticks(4)
        .tickFormat(d => `$${d.valueOf().toFixed(0)}`)
      )
      .call(g => g.select(".domain").attr("stroke", "#1e293b").attr("stroke-opacity", 0.4))
      .call(g => g.selectAll(".tick line").attr("stroke", "#334155"))
      .call(g => g.selectAll(".tick text").attr("fill", "#64748b").attr("font-size", "8.5px").attr("font-family", "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"));

    // Draw Line
    const lineGenerator = d3.line<ChartDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.price))
      .curve(d3.curveMonotoneX); // Super organic price curve feel

    // Area Path
    const areaGenerator = d3.area<ChartDataPoint>()
      .x(d => xScale(d.date))
      .y0(chartHeight)
      .y1(d => yScale(d.price))
      .curve(d3.curveMonotoneX);

    // Append Area path
    g.append("path")
      .datum(dataset)
      .attr("fill", `url(#${gradientId})`)
      .attr("d", areaGenerator);

    // Append Line path
    g.append("path")
      .datum(dataset)
      .attr("fill", "none")
      .attr("stroke", strokeColor)
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("d", lineGenerator);

    // Interactive Hover Tracking Group
    const focus = g.append("g")
      .attr("style", "display: none;");

    // Tracking Line
    focus.append("line")
      .attr("stroke", "#475569")
      .attr("stroke-width", 1.25)
      .attr("stroke-dasharray", "3,3")
      .attr("y1", 0)
      .attr("y2", chartHeight);

    // Tracking Circle Glow
    focus.append("circle")
      .attr("r", 7)
      .attr("fill", strokeColor)
      .attr("fill-opacity", 0.15);

    // Tracking Circle Border
    focus.append("circle")
      .attr("r", 4)
      .attr("fill", strokeColor)
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 1.5);

    // Catch Mouse Events Rect overlay
    svg.append("rect")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .attr("fill", "transparent")
      .attr("class", "hover-layer")
      .style("cursor", "crosshair")
      .on("mouseover", () => focus.style("display", null))
      .on("mouseout", () => {
        focus.style("display", "none");
        setHoverData(null);
      })
      .on("mousemove", function (event) {
        // Find closest date coordinates
        const mouseX = d3.pointer(event)[0];
        const hoverDateVal = xScale.invert(mouseX);
        const bisectDate = d3.bisector<ChartDataPoint, Date>(d => d.date).left;
        const idx = bisectDate(dataset, hoverDateVal, 1);
        
        const d0 = dataset[idx - 1];
        const d1 = dataset[idx];
        if (!d0) return;
        
        const point = !d1 ? d0 : (hoverDateVal.getTime() - d0.date.getTime() > d1.date.getTime() - hoverDateVal.getTime() ? d1 : d0);

        focus.attr("transform", `translate(${xScale(point.date)}, 0)`);
        focus.select("circle").attr("cy", yScale(point.price));
        focus.selectAll("circle").attr("cy", yScale(point.price));
        focus.select("line").attr("y1", 0).attr("y2", chartHeight);

        setHoverData(point);
      });

  }, [dimensions, dataset, ticker, trend]);

  return (
    <div className="relative font-sans" ref={containerRef} id={`stock-d3-chart-container-${ticker}`}>
      {/* Dynamic hover metrics overlay banner */}
      <div className="absolute top-2.5 right-4 z-10 flex items-center gap-3 bg-[#0a0d16]/85 border border-slate-800/60 px-2.5 py-1 rounded-lg text-[9px] font-mono shadow">
        {hoverData ? (
          <>
            <span className="text-slate-500 uppercase">Selected:</span>
            <span className="text-slate-100 font-bold">{hoverData.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <span className="text-slate-500">Value:</span>
            <span className="text-blue-400 font-black">${hoverData.price.toFixed(2)}</span>
          </>
        ) : (
          <>
            <span className="text-slate-500 uppercase">Live:</span>
            <span className="text-slate-300 font-bold">${currentPrice.toFixed(2)}</span>
            <span className="text-slate-600 font-light truncate max-w-[60px]">{ticker}</span>
          </>
        )}
      </div>

      <svg 
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="overflow-visible block select-none"
      />
    </div>
  );
}
