/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { Trophy, TrendingUp, Users, DollarSign, Star, Award } from "lucide-react";
import { Skill } from "../types";

interface TopTenLeaderboardProps {
  skills: Skill[];
}

type SortKey = "earnings" | "salesCount" | "activeUsers";

const RANK_COLORS: { [k: number]: string } = {
  1: "text-yellow-400",
  2: "text-slate-300",
  3: "text-amber-600",
};

const RANK_BG: { [k: number]: string } = {
  1: "bg-yellow-500/10 border-yellow-500/30",
  2: "bg-slate-400/10 border-slate-400/30",
  3: "bg-amber-700/10 border-amber-700/30",
};

const TROPHY_COLORS: { [k: number]: string } = {
  1: "text-yellow-400",
  2: "text-slate-300",
  3: "text-amber-600",
};

const CATEGORY_COLOR: { [k: string]: string } = {
  Language: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  Audio: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  Vision: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  Utility: "bg-amber-500/10 text-amber-300 border-amber-500/20",
};

const BILLING_COLOR: { [k: string]: string } = {
  "Pay-as-you-go": "text-cyan-400",
  "Flat Subscription": "text-emerald-400",
  "One-time Purchase": "text-violet-400",
};

export default function TopTenLeaderboard({ skills }: TopTenLeaderboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>("earnings");

  const sorted = [...skills]
    .sort((a, b) => b[sortKey] - a[sortKey])
    .slice(0, 10);

  const sortOptions: { key: SortKey; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "earnings", label: "Earnings", icon: <DollarSign className="w-3.5 h-3.5" />, color: "text-cyan-400" },
    { key: "salesCount", label: "Sales Count", icon: <TrendingUp className="w-3.5 h-3.5" />, color: "text-emerald-400" },
    { key: "activeUsers", label: "Active Users", icon: <Users className="w-3.5 h-3.5" />, color: "text-violet-400" },
  ];

  const maxValue = sorted.length > 0 ? sorted[0][sortKey] : 1;

  const formatValue = (val: number) => {
    if (sortKey === "earnings") return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return val.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-yellow-950/20 border border-yellow-900/40 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
        <Trophy className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <div className="font-bold text-yellow-300">Top 10 AI Skill Rankings</div>
          <p className="text-slate-400 leading-relaxed">
            Live leaderboard ranking the top 10 performing AI skills across the marketplace by revenue earned, total sales, and active user adoption. Use the sort controls to switch between ranking dimensions.
          </p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">Rank by</span>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80 gap-0.5">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                sortKey === opt.key
                  ? "bg-slate-800 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className={sortKey === opt.key ? opt.color : ""}>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard List */}
      {sorted.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 font-mono text-xs">
          No skill data available yet. Run a simulation to populate the leaderboard.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((skill, idx) => {
            const rank = idx + 1;
            const barWidth = maxValue > 0 ? (skill[sortKey] / maxValue) * 100 : 0;
            const rowBg = RANK_BG[rank] ?? "bg-slate-950 border-slate-800/80";
            const rankColor = RANK_COLORS[rank] ?? "text-slate-500";

            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                className={`border rounded-2xl p-4 ${rowBg} flex items-center gap-4`}
              >
                {/* Rank Badge */}
                <div className={`w-8 h-8 flex items-center justify-center shrink-0 rounded-xl font-black text-sm ${rankColor} bg-slate-900/70`}>
                  {rank <= 3 ? (
                    <Trophy className={`w-4 h-4 ${TROPHY_COLORS[rank]}`} />
                  ) : (
                    <span className="text-slate-500 font-mono text-xs">{rank}</span>
                  )}
                </div>

                {/* Skill Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-100 text-sm truncate">{skill.name}</span>
                    <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${CATEGORY_COLOR[skill.category] ?? "bg-slate-800 text-slate-400 border-slate-700"}`}>
                      {skill.category}
                    </span>
                    <span className={`text-[10px] font-semibold ${BILLING_COLOR[skill.billingModel] ?? "text-slate-400"}`}>
                      {skill.billingModel}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.04 + 0.1 }}
                    />
                  </div>

                  {/* Sub-metrics row */}
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono flex-wrap">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-cyan-500" />
                      <span className="text-cyan-400 font-bold">${skill.earnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span>{skill.salesCount.toLocaleString()} sales</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-violet-400" />
                      <span>{skill.activeUsers.toLocaleString()} users</span>
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${skill.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : skill.status === "Draft" ? "bg-slate-800 text-slate-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {skill.status}
                    </span>
                  </div>
                </div>

                {/* Primary metric value */}
                <div className="text-right shrink-0">
                  <div className={`font-black text-base font-mono ${sortKey === "earnings" ? "text-cyan-400" : sortKey === "salesCount" ? "text-emerald-400" : "text-violet-400"}`}>
                    {formatValue(skill[sortKey])}
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono mt-0.5">
                    {sortOptions.find(o => o.key === sortKey)?.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Summary Footer */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Total Earnings (Top 10)",
              value: `$${sorted.reduce((s, sk) => s + sk.earnings, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              icon: <DollarSign className="w-4 h-4 text-cyan-400" />,
              color: "text-cyan-400",
            },
            {
              label: "Total Sales (Top 10)",
              value: sorted.reduce((s, sk) => s + sk.salesCount, 0).toLocaleString(),
              icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
              color: "text-emerald-400",
            },
            {
              label: "Total Active Users (Top 10)",
              value: sorted.reduce((s, sk) => s + sk.activeUsers, 0).toLocaleString(),
              icon: <Users className="w-4 h-4 text-violet-400" />,
              color: "text-violet-400",
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-xl">{stat.icon}</div>
              <div>
                <div className={`font-black font-mono text-sm ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mt-0.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
