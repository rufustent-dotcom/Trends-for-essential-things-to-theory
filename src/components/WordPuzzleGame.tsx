/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, Trophy, Clock, Zap, Gift, Star, CheckCircle2, XCircle, SkipForward } from "lucide-react";

// ─── Word bank: tech / AI skill themed words ───────────────────────────────
const WORD_BANK: { word: string; hint: string; category: string }[] = [
  { word: "ALGORITHM",   hint: "Step-by-step problem-solving procedure",         category: "Computing" },
  { word: "NEURAL",      hint: "Inspired by the structure of the human brain",    category: "AI" },
  { word: "INFERENCE",   hint: "Deriving conclusions from a trained model",       category: "AI" },
  { word: "WEBHOOK",     hint: "HTTP callback triggered by events",               category: "APIs" },
  { word: "SUBSTRATE",   hint: "Underlying foundation layer in systems",          category: "Systems" },
  { word: "RECURSION",   hint: "A function that calls itself",                    category: "Computing" },
  { word: "SYNTHESIS",   hint: "Generating audio or content from AI models",      category: "AI" },
  { word: "PIPELINE",    hint: "Sequence of data processing stages",              category: "Systems" },
  { word: "EMBEDDING",   hint: "Numeric vector representation of text",           category: "AI" },
  { word: "TOKENIZE",    hint: "Break text into discrete units for NLP",          category: "AI" },
  { word: "SANDBOX",     hint: "Isolated test environment",                       category: "Dev Tools" },
  { word: "MONETIZE",    hint: "Convert a skill or product into revenue",         category: "Business" },
  { word: "REFACTOR",    hint: "Restructure code without changing behavior",       category: "Computing" },
  { word: "LATENCY",     hint: "Delay between a request and its response",        category: "Systems" },
  { word: "PROTOCOL",    hint: "Rules governing data exchange",                   category: "Systems" },
  { word: "GRADIENT",    hint: "Partial derivative used in training neural nets",  category: "AI" },
  { word: "PAYLOAD",     hint: "Data carried inside an API request",              category: "APIs" },
  { word: "COMPILER",    hint: "Transforms source code into machine code",        category: "Computing" },
  { word: "TELEMETRY",   hint: "Remote measurement and data collection",          category: "Systems" },
  { word: "DIFFUSION",   hint: "AI image generation technique",                   category: "AI" },
  { word: "THROTTLE",    hint: "Limit the rate of API calls",                     category: "APIs" },
  { word: "LEVERAGE",    hint: "Multiplying output through strategic tools",      category: "Business" },
  { word: "FORECAST",    hint: "Predict future metrics from historical data",     category: "Business" },
  { word: "BENCHMARK",   hint: "Standard reference point for performance",        category: "Computing" },
  { word: "COGNITIVE",   hint: "Relating to mental processes in AI systems",      category: "AI" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function scramble(word: string): string {
  const arr = word.split("");
  // Fisher-Yates shuffle, but ensure result is never equal to the original
  for (let attempt = 0; attempt < 20; attempt++) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (arr.join("") !== word) break;
  }
  return arr.join("");
}

function pickRandom<T>(arr: T[], exclude?: T[]): T {
  const pool = exclude ? arr.filter(x => !exclude.includes(x)) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

const ROUND_LIMIT = 8;
const SECONDS_PER_ROUND = 30;

const CATEGORY_COLORS: Record<string, string> = {
  AI:        "text-purple-400 bg-purple-950/40 border-purple-800/40",
  Computing: "text-cyan-400 bg-cyan-950/40 border-cyan-800/40",
  APIs:      "text-amber-400 bg-amber-950/40 border-amber-800/40",
  Systems:   "text-blue-400 bg-blue-950/40 border-blue-800/40",
  "Dev Tools": "text-emerald-400 bg-emerald-950/40 border-emerald-800/40",
  Business:  "text-rose-400 bg-rose-950/40 border-rose-800/40",
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function WordPuzzleGame() {
  const [gameState, setGameState] = useState<"intro" | "playing" | "result">("intro");
  const [round, setRound]           = useState(0);
  const [score, setScore]           = useState(0);
  const [streak, setStreak]         = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft]     = useState(SECONDS_PER_ROUND);
  const [input, setInput]           = useState("");
  const [feedback, setFeedback]     = useState<"correct" | "wrong" | "timeout" | null>(null);
  const [usedWords, setUsedWords]   = useState<string[]>([]);
  const [currentEntry, setCurrentEntry] = useState<{ word: string; hint: string; category: string; scrambled: string } | null>(null);
  const [roundHistory, setRoundHistory] = useState<Array<{ word: string; guessed: string; correct: boolean; timeUsed: number }>>([]);

  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  // ── Pick next word ──────────────────────────────────────────────────────
  const loadNextRound = useCallback((usedSoFar: string[]) => {
    const entry = pickRandom(WORD_BANK, WORD_BANK.filter(w => usedSoFar.includes(w.word)));
    const sc = scramble(entry.word);
    setCurrentEntry({ ...entry, scrambled: sc });
    setTimeLeft(SECONDS_PER_ROUND);
    setInput("");
    setFeedback(null);
    startTimeRef.current = Date.now();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // ── Start game ─────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    setScore(0);
    setRound(1);
    setStreak(0);
    setBestStreak(0);
    setUsedWords([]);
    setRoundHistory([]);
    setGameState("playing");
    const first = pickRandom(WORD_BANK);
    const sc    = scramble(first.word);
    setCurrentEntry({ ...first, scrambled: sc });
    setTimeLeft(SECONDS_PER_ROUND);
    setInput("");
    setFeedback(null);
    startTimeRef.current = Date.now();
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  // ── Advance to next round or end ───────────────────────────────────────
  const advanceRound = useCallback((_wasCorrect: boolean) => {
    if (!currentEntry) return;

    const next = round + 1;
    if (next > ROUND_LIMIT) {
      setGameState("result");
      return;
    }

    const newUsed = [...usedWords, currentEntry.word];
    setUsedWords(newUsed);
    loadNextRound(newUsed);
    setRound(next);
  }, [currentEntry, loadNextRound, round, usedWords]);

  // ── Timeout handler ────────────────────────────────────────────────────
  const handleTimeout = useCallback(() => {
    if (!currentEntry) return;
    clearInterval(timerRef.current!);
    setFeedback("timeout");
    setStreak(0);
    setRoundHistory(prev => [...prev, { word: currentEntry.word, guessed: input, correct: false, timeUsed: SECONDS_PER_ROUND }]);
    setTimeout(() => advanceRound(false), 1800);
  }, [currentEntry, input, advanceRound]);

  // ── Timer tick ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== "playing" || feedback) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [gameState, feedback, currentEntry]);

  // ── Trigger timeout when timer reaches 0 ──────────────────────────────
  useEffect(() => {
    if (gameState === "playing" && !feedback && timeLeft === 0) {
      handleTimeout();
    }
  }, [timeLeft, gameState, feedback, handleTimeout]);

  // ── Submit answer ──────────────────────────────────────────────────────
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentEntry || feedback) return;
    clearInterval(timerRef.current!);

    const timeUsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    const correct  = input.trim().toUpperCase() === currentEntry.word;

    setRoundHistory(prev => [...prev, { word: currentEntry.word, guessed: input.trim().toUpperCase(), correct, timeUsed }]);

    if (correct) {
      const timeBonus  = Math.max(0, SECONDS_PER_ROUND - timeUsed);
      const newStreak  = streak + 1;
      const streakBonus = newStreak >= 3 ? 10 : 0;
      const points     = 20 + timeBonus + streakBonus;
      setScore(prev => prev + points);
      setStreak(newStreak);
      setBestStreak(prev => Math.max(prev, newStreak));
      setFeedback("correct");
    } else {
      setStreak(0);
      setFeedback("wrong");
    }

    setTimeout(() => advanceRound(correct), 1500);
  }, [currentEntry, feedback, input, streak, advanceRound]);

  // ── Skip word ──────────────────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    if (!currentEntry || feedback) return;
    clearInterval(timerRef.current!);
    setRoundHistory(prev => [...prev, { word: currentEntry.word, guessed: "—skipped—", correct: false, timeUsed: SECONDS_PER_ROUND - timeLeft }]);
    setStreak(0);
    setFeedback("wrong");
    setTimeout(() => advanceRound(false), 1200);
  }, [currentEntry, feedback, timeLeft, advanceRound]);

  // ── Tier label ─────────────────────────────────────────────────────────
  const scoreTier = score >= 160
    ? { label: "Skill Master 🏆",   color: "text-amber-400" }
    : score >= 100
    ? { label: "Senior Dev ⭐",      color: "text-cyan-400" }
    : score >= 60
    ? { label: "Journeyman 🔧",      color: "text-emerald-400" }
    : { label: "Apprentice 🌱",       color: "text-slate-400" };

  const timerColor = timeLeft > 15 ? "text-emerald-400" : timeLeft > 7 ? "text-amber-400" : "text-red-400 animate-pulse";
  const catStyle   = currentEntry ? (CATEGORY_COLORS[currentEntry.category] ?? "text-slate-400 bg-slate-800/40 border-slate-700") : "";

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-black tracking-tight text-white uppercase font-headline">
              Gift of Skill: Word Puzzle
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-lg">
            Unscramble tech-and-AI skill keywords to earn points. Faster answers and hot streaks unlock bonus multipliers.
          </p>
        </div>

        {gameState !== "intro" && (
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Score</div>
              <div className="text-xl font-black font-mono text-amber-400">{score}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Round</div>
              <div className="text-xl font-black font-mono text-slate-200">{Math.min(round, ROUND_LIMIT)}/{ROUND_LIMIT}</div>
            </div>
            {streak >= 2 && (
              <div className="text-center">
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Streak</div>
                <div className="text-xl font-black font-mono text-emerald-400 flex items-center gap-1">
                  <Zap className="w-4 h-4" />{streak}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">

        {/* ── INTRO SCREEN ─────────────────────────────────────────────── */}
        {gameState === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-8 flex flex-col items-center gap-6 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-900/40">
              <Gift className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tight text-white uppercase font-headline">Word Puzzle Challenge</h3>
              <p className="text-sm text-slate-400 max-w-sm font-sans leading-relaxed">
                {ROUND_LIMIT} rounds · {SECONDS_PER_ROUND}s per word · tech &amp; AI vocabulary
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full max-w-sm text-xs font-mono text-slate-400">
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1">
                <Clock className="w-4 h-4 text-cyan-400 mx-auto" />
                <div className="font-bold text-slate-200">Time bonus</div>
                <div className="text-[10px] text-slate-500">Faster = more pts</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1">
                <Zap className="w-4 h-4 text-emerald-400 mx-auto" />
                <div className="font-bold text-slate-200">Streak bonus</div>
                <div className="text-[10px] text-slate-500">3+ streak = +10pts</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1">
                <Star className="w-4 h-4 text-amber-400 mx-auto" />
                <div className="font-bold text-slate-200">Max score</div>
                <div className="text-[10px] text-slate-500">~{ROUND_LIMIT * 50}+ pts</div>
              </div>
            </div>

            <button
              onClick={startGame}
              className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-extrabold text-sm uppercase tracking-widest px-10 py-3.5 rounded-xl transition shadow-lg shadow-purple-900/30 cursor-pointer"
            >
              Start Game
            </button>
          </motion.div>
        )}

        {/* ── PLAYING SCREEN ───────────────────────────────────────────── */}
        {gameState === "playing" && currentEntry && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Timer bar */}
            <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className={`absolute left-0 top-0 h-full rounded-full transition-colors ${
                  timeLeft > 15 ? "bg-emerald-500" : timeLeft > 7 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${(timeLeft / SECONDS_PER_ROUND) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {/* Puzzle card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-7 flex flex-col items-center gap-6 relative">

              {/* Meta row */}
              <div className="w-full flex items-center justify-between text-[10px] font-mono">
                <span className={`px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${catStyle}`}>
                  {currentEntry.category}
                </span>
                <span className={`font-extrabold text-base ${timerColor}`}>
                  <Clock className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                  {timeLeft}s
                </span>
              </div>

              {/* Scrambled word */}
              <div className="space-y-2 text-center">
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Unscramble this word</div>
                <div className="flex gap-2 flex-wrap justify-center">
                  {currentEntry.scrambled.split("").map((ch, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="w-9 h-10 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 text-lg font-black font-mono text-white uppercase shadow-sm"
                    >
                      {ch}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Hint */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400 font-sans text-center max-w-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mr-1.5">Hint:</span>
                {currentEntry.hint}
              </div>

              {/* Input + submit */}
              <form onSubmit={handleSubmit} className="w-full max-w-xs flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                  disabled={!!feedback}
                  maxLength={currentEntry.word.length + 2}
                  placeholder={`${currentEntry.word.length} letters`}
                  className="flex-1 bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm uppercase tracking-widest rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-slate-600 text-center"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  disabled={!!feedback || !input.trim()}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Go
                </button>
              </form>

              {/* Skip */}
              {!feedback && (
                <button
                  onClick={handleSkip}
                  className="text-slate-500 hover:text-slate-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Skip word
                </button>
              )}

              {/* Feedback overlay */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    key="feedback"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 py-3 rounded-b-2xl font-extrabold text-sm font-mono uppercase tracking-widest ${
                      feedback === "correct"
                        ? "bg-emerald-950/90 text-emerald-400"
                        : feedback === "wrong"
                        ? "bg-red-950/90 text-red-400"
                        : "bg-amber-950/90 text-amber-400"
                    }`}
                  >
                    {feedback === "correct" ? (
                      <><CheckCircle2 className="w-4 h-4" /> Correct! +pts</>
                    ) : feedback === "wrong" ? (
                      <><XCircle className="w-4 h-4" /> Answer: {currentEntry.word}</>
                    ) : (
                      <><Clock className="w-4 h-4" /> Time up! Answer: {currentEntry.word}</>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mini history strip */}
            {roundHistory.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {roundHistory.map((r, i) => (
                  <div
                    key={i}
                    title={`${r.word} — ${r.correct ? "✓ correct" : "✗ wrong"}`}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border ${
                      r.correct
                        ? "bg-emerald-950/60 border-emerald-800 text-emerald-400"
                        : "bg-red-950/60 border-red-900 text-red-400"
                    }`}
                  >
                    {r.correct ? "✓" : "✗"}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── RESULT SCREEN ────────────────────────────────────────────── */}
        {gameState === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Score card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 flex flex-col items-center gap-5">
              <Trophy className="w-12 h-12 text-amber-400 drop-shadow-lg" />

              <div className="text-center space-y-1">
                <div className={`text-xl font-black font-headline uppercase tracking-tight ${scoreTier.color}`}>
                  {scoreTier.label}
                </div>
                <div className="text-5xl font-black font-mono text-white">{score}</div>
                <div className="text-sm text-slate-500 font-mono">points earned</div>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full max-w-sm text-xs text-center font-mono">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Correct</div>
                  <div className="text-lg font-black text-emerald-400">{roundHistory.filter(r => r.correct).length}/{ROUND_LIMIT}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Best Streak</div>
                  <div className="text-lg font-black text-cyan-400">{bestStreak}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Accuracy</div>
                  <div className="text-lg font-black text-amber-400">
                    {Math.round((roundHistory.filter(r => r.correct).length / ROUND_LIMIT) * 100)}%
                  </div>
                </div>
              </div>

              <button
                onClick={startGame}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-extrabold text-sm uppercase tracking-widest px-8 py-3 rounded-xl transition shadow-lg shadow-purple-900/30 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Play Again
              </button>
            </div>

            {/* Round recap table */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-[10px] font-extrabold font-mono uppercase tracking-widest text-slate-400">Round Recap</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-850">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="text-[10px] uppercase font-mono font-bold bg-slate-900 text-slate-500 border-b border-slate-850">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Word</th>
                      <th className="px-3 py-2">Your Answer</th>
                      <th className="px-3 py-2 text-center">Result</th>
                      <th className="px-3 py-2 text-right">Time Used</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {roundHistory.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-900/40">
                        <td className="px-3 py-2 text-slate-500 font-mono">{i + 1}</td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-100">{r.word}</td>
                        <td className={`px-3 py-2 font-mono ${r.correct ? "text-emerald-400" : "text-red-400"}`}>
                          {r.guessed || "—"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {r.correct
                            ? <span className="text-emerald-400">✓</span>
                            : <span className="text-red-400">✗</span>
                          }
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-400">{r.timeUsed}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
