import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

export interface DonutDataPoint {
  ticker: string;
  value: number; // total market value (shares * currentPrice)
  color?: string;
}

interface PortfolioD3DonutProps {
  data: DonutDataPoint[];
  height?: number;
}

const PRESET_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#818cf8", // indigo
  "#a855f7", // purple
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#ec4899", // pink
  "#14b8a6", // teal
];

export default function PortfolioD3Donut({ data, height = 240 }: PortfolioD3DonutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height });
  const [hoverAsset, setHoverAsset] = useState<{ ticker: string; pct: number; value: number } | null>(null);

  // Responsive tracker
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      setDimensions({
        width: Math.max(entries[0].contentRect.width, 100),
        height
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    if (!svgRef.current || data.length === 0 || totalValue <= 0) return;

    const { width, height } = dimensions;
    const radius = Math.min(width, height) / 2 - 15;
    const innerRadius = radius * 0.65; // Donut thickness factor

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Group center container
    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Prepare D3 pie generator
    const pie = d3.pie<DonutDataPoint>()
      .value(d => d.value)
      .sort(null); // Keep array order

    // Prepare D3 arcs
    const arc = d3.arc<d3.PieArcDatum<DonutDataPoint>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(4) // Round edges
      .padAngle(0.03);  // Padding between slices

    const hoverArc = d3.arc<d3.PieArcDatum<DonutDataPoint>>()
      .innerRadius(innerRadius)
      .outerRadius(radius + 5)
      .cornerRadius(4)
      .padAngle(0.01);

    // Color mapper
    const getColor = (d: DonutDataPoint, index: number) => {
      if (d.color) return d.color;
      return PRESET_COLORS[index % PRESET_COLORS.length];
    };

    // Draw slices
    const paths = g.selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("path")
      .attr("class", "slice")
      .attr("fill", (d, i) => getColor(d.data, i))
      .attr("opacity", 0.85)
      .attr("cursor", "pointer")
      .attr("stroke", "#0f172a") // Deep outline matching slate background
      .attr("stroke-width", 1.5)
      .attr("d", arc);

    // Initial transition animation on load
    paths.transition()
      .duration(750)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(interpolate(t)) || "";
        };
      });

    // Interaction handlers
    paths.on("mouseover", function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("opacity", 1.0)
        .attr("d", hoverArc);

      const percent = (d.data.value / totalValue) * 100;
      setHoverAsset({
        ticker: d.data.ticker,
        value: d.data.value,
        pct: percent
      });
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("opacity", 0.85)
        .attr("d", arc);
      
      setHoverAsset(null);
    });

  }, [dimensions, data, totalValue]);

  return (
    <div className="relative flex flex-col items-center justify-center h-full min-h-[220px]" ref={containerRef} id="portfolio-allocation-donut">
      <svg 
        ref={svgRef} 
        width={dimensions.width} 
        height={dimensions.height}
        className="block select-none overflow-visible"
      />

      {/* Floating center content inside the donut hole */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
        {hoverAsset ? (
          <div className="text-center animate-fade-in">
            <span className="text-xl font-black text-white font-mono tracking-wide">{hoverAsset.ticker}</span>
            <span className="block text-xxs text-slate-500 uppercase tracking-wider mt-0.5">Share Weight</span>
            <span className="block text-xs font-bold text-emerald-400 font-mono mt-0.5">{hoverAsset.pct.toFixed(1)}%</span>
            <span className="block text-[9.5px] text-slate-400 font-medium font-mono">${hoverAsset.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-2xl font-black text-slate-350 font-mono tracking-tight">$</span>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest block leading-tight mt-0.5">Asset Allocation</span>
            <span className="text-[9.5px] text-slate-500 font-mono block">Hover segment</span>
          </div>
        )}
      </div>
    </div>
  );
}
