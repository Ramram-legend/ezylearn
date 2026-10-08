'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Zap, CheckCircle2, XCircle } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AnimationStep {
  id: string;
  label: string;
  description: string;
  /** CSS color of the highlight ring shown on step activation */
  color?: string;
  /** Key elements to highlight during this step (by element id) */
  highlights?: string[];
  /** Optional micro-challenge for this step */
  challenge?: 
    | {
        type?: 'quiz'; // Backward compatibility
        question: string;
        options: string[];
        correct: number;
      }
    | {
        type: 'drag-drop';
        instruction: string;
        draggables: string[];
        dropZones: { id: string; label: string; expectedDraggable: string }[];
      };
}

export interface AnimationElement {
  id: string;
  type: 'circle' | 'rect' | 'arrow' | 'label' | 'group' | 'particle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color?: string;
  glowColor?: string;
  label?: string;
  /** Element rotates when animated */
  spin?: boolean;
  /** Element pulses scale */
  pulse?: boolean;
  /** Element floats vertically */
  float?: boolean;
  /** Connected to another element id (draws an arrow) */
  connectTo?: string[];
  /** Visible only during these step ids */
  visibleInSteps?: string[];
}

export interface AnimationData {
  title: string;
  theme?: 'space' | 'biology' | 'chemistry' | 'physics' | 'tech' | 'default';
  elements: AnimationElement[];
  steps: AnimationStep[];
  /** Quick-check question at the end */
  finalQuiz?: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  };
}

interface Props {
  data: AnimationData;
  className?: string;
}

// ── Theme palettes ────────────────────────────────────────────────────────────
const THEMES: Record<string, { bg: string; accent: string; glow: string; text: string }> = {
  space:     { bg: '#020617', accent: '#818cf8', glow: '#6366f1', text: '#e2e8f0' },
  biology:   { bg: '#022c22', accent: '#34d399', glow: '#10b981', text: '#d1fae5' },
  chemistry: { bg: '#1e1b4b', accent: '#a78bfa', glow: '#8b5cf6', text: '#ede9fe' },
  physics:   { bg: '#0c1445', accent: '#38bdf8', glow: '#0ea5e9', text: '#e0f2fe' },
  tech:      { bg: '#0f172a', accent: '#22d3ee', glow: '#06b6d4', text: '#cffafe' },
  default:   { bg: '#0f172a', accent: '#60a5fa', glow: '#3b82f6', text: '#dbeafe' },
};

// ── SVG renderer for elements ─────────────────────────────────────────────────
function renderElement(
  el: AnimationElement,
  allElements: AnimationElement[],
  activeStep: string | null,
  theme: typeof THEMES['default'],
  setRef: (id: string, node: any) => void
): React.ReactNode {
  const isVisible = !el.visibleInSteps || !activeStep || el.visibleInSteps.includes(activeStep);
  if (!isVisible) return null;

  const color = el.color || theme.accent;
  const glow = el.glowColor || theme.glow;

  switch (el.type) {
    case 'circle':
      return (
        <g key={el.id} ref={(n) => setRef(el.id, n)} data-eltype="circle" data-x={el.x} data-y={el.y} data-float={el.float} data-pulse={el.pulse} data-spin={el.spin} style={{ filter: `drop-shadow(0 0 8px ${glow})`, transformOrigin: `${el.x}px ${el.y}px` }}>
          <circle cx={el.x} cy={el.y} r={el.radius || 30} fill={color} opacity={0.9} />
          {el.label && (
            <text x={el.x} y={el.y + 5} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
              {el.label}
            </text>
          )}
        </g>
      );

    case 'rect':
      return (
        <g key={el.id} ref={(n) => setRef(el.id, n)} data-eltype="rect" data-x={el.x} data-y={el.y} data-float={el.float} data-pulse={el.pulse} data-spin={el.spin} transform={`translate(${el.x},${el.y})`}
          style={{ filter: `drop-shadow(0 0 6px ${glow})` }}>
          <rect
            x={-(el.width || 80) / 2}
            y={-(el.height || 40) / 2}
            width={el.width || 80}
            height={el.height || 40}
            rx={10}
            fill={color}
            opacity={0.85}
          />
          {el.label && (
            <text x={0} y={5} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
              {el.label}
            </text>
          )}
        </g>
      );

    case 'particle':
      return (
        <circle
          key={el.id}
          ref={(n) => setRef(el.id, n)}
          data-eltype="particle" data-x={el.x} data-y={el.y} data-float={el.float}
          cx={el.x}
          cy={el.y}
          r={el.radius || 5}
          fill={color}
          opacity={0.7}
          style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
        />
      );

    case 'arrow':
      if (!el.connectTo?.[0]) return null;
      const target = allElements.find(e => e.id === el.connectTo![0]);
      if (!target) return null;
      const dx = target.x - el.x;
      const dy = target.y - el.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / len;
      const uy = dy / len;
      const startR = (el.radius || 30) + 2;
      const endR = (target.radius || 30) + 2;
      return (
        <line
          key={el.id}
          x1={el.x + ux * startR}
          y1={el.y + uy * startR}
          x2={target.x - ux * endR}
          y2={target.y - uy * endR}
          stroke={color}
          strokeWidth={2}
          strokeDasharray="6,3"
          markerEnd="url(#arrowhead)"
          opacity={0.8}
        />
      );

    case 'label':
      return (
        <text
          key={el.id}
          ref={(n) => setRef(el.id, n)}
          data-eltype="label" data-x={el.x} data-y={el.y} data-float={el.float} data-pulse={el.pulse} data-spin={el.spin}
          x={el.x}
          y={el.y}
          textAnchor="middle"
          fill={color}
          fontSize={el.width || 14}
          fontWeight="bold"
          style={{ filter: `drop-shadow(0 0 4px ${glow})`, transformOrigin: `${el.x}px ${el.y}px` }}
        >
          {el.label}
        </text>
      );

    default:
      return null;
  }
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ConceptAnimator({ data, className = '' }: Props) {
  const theme = THEMES[data.theme || 'default'];
  const steps = data.steps || [];

  const [stepIdx, setStepIdx] = useState(-1); // -1 = overview
  const [isPlaying, setIsPlaying] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | null>>({});
  const [dragAnswers, setDragAnswers] = useState<Record<string, Record<string, string>>>({});
  const [finalQuizAnswer, setFinalQuizAnswer] = useState<number | null>(null);
  const [showFinalQuiz, setShowFinalQuiz] = useState(false);
  
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const frameRef = useRef<number>(0);

  const elementRefs = useRef<Map<string, SVGElement>>(new Map());
  const highlightPulseRefs = useRef<Map<string, SVGGElement>>(new Map());
  const highlightRingRefs = useRef<Map<string, SVGCircleElement>>(new Map());

  const setElementRef = useCallback((id: string, node: SVGElement | null) => {
    if (node) elementRefs.current.set(id, node);
    else elementRefs.current.delete(id);
  }, []);

  const setHighlightPulseRef = useCallback((id: string, node: SVGGElement | null) => {
    if (node) highlightPulseRefs.current.set(id, node);
    else highlightPulseRefs.current.delete(id);
  }, []);

  const setHighlightRingRef = useCallback((id: string, node: SVGCircleElement | null) => {
    if (node) highlightRingRefs.current.set(id, node);
    else highlightRingRefs.current.delete(id);
  }, []);

  const activeStep = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;

  // ── Animation loop ───────────────────────────────────────────────────────────
  const animate = useCallback((ts: number) => {
    if (ts - lastFrameRef.current > 16) {
      frameRef.current += 1;
      const f = frameRef.current;

      elementRefs.current.forEach((node, id) => {
        const type = node.getAttribute('data-eltype');
        const x = parseFloat(node.getAttribute('data-x') || '0');
        const y = parseFloat(node.getAttribute('data-y') || '0');
        const float = node.getAttribute('data-float') === 'true';
        const pulse = node.getAttribute('data-pulse') === 'true';
        const spin = node.getAttribute('data-spin') === 'true';

        const floatY = float ? Math.sin(f * 0.04 + x * 0.01) * 8 : 0;
        const scale = pulse ? 1 + Math.sin(f * 0.06) * 0.08 : 1;
        const rotate = spin ? (f * 1.2) % 360 : 0;

        if (type === 'particle') {
          const cx = x + Math.sin(f * 0.05 + y) * 15;
          node.setAttribute('cx', String(cx));
          node.setAttribute('cy', String(y + floatY));
          node.setAttribute('opacity', String(0.7 + Math.sin(f * 0.08) * 0.3));
        } else if (type === 'circle' || type === 'label') {
          node.setAttribute('transform', `translate(0, ${floatY}) rotate(${rotate}) scale(${scale})`);
        } else if (type === 'rect') {
          node.setAttribute('transform', `translate(${x}, ${y + floatY}) rotate(${rotate}) scale(${scale})`);
        }
      });

      highlightPulseRefs.current.forEach((node, id) => {
        const pulseSz = 1 + Math.sin(f * 0.15) * 0.12;
        node.style.transform = `scale(${pulseSz})`;
      });

      highlightRingRefs.current.forEach((node, id) => {
        const rAttr = node.getAttribute('data-baser');
        if (rAttr) {
          const r = parseFloat(rAttr) + 14 + Math.sin(f * 0.12) * 4;
          node.setAttribute('r', String(r));
          node.setAttribute('opacity', String(0.7 + Math.sin(f * 0.1) * 0.3));
        }
      });

      lastFrameRef.current = ts;
    }
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [animate]);

  // ── Auto-advance steps when playing ─────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setStepIdx(prev => {
        if (prev < steps.length - 1) return prev + 1;
        setIsPlaying(false);
        if (data.finalQuiz) setShowFinalQuiz(true);
        return prev;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [isPlaying, steps.length, data.finalQuiz]);

  const handlePrev = () => { setStepIdx(i => Math.max(-1, i - 1)); setIsPlaying(false); };
  const handleNext = () => {
    const next = stepIdx + 1;
    if (next < steps.length) {
      setStepIdx(next);
    } else if (data.finalQuiz && !showFinalQuiz) {
      setShowFinalQuiz(true);
    }
    setIsPlaying(false);
  };
  const handleReset = () => { setStepIdx(-1); setIsPlaying(false); setShowFinalQuiz(false); setFinalQuizAnswer(null); setQuizAnswers({}); setDragAnswers({}); };

  const handleStepChallenge = (stepId: string, optIdx: number) => {
    setQuizAnswers(a => ({ ...a, [stepId]: optIdx }));
  };

  // ── Highlight pulse on active step elements ─────────────────────────────────
  const highlightedIds = activeStep?.highlights || [];

  // ── SVG canvas ───────────────────────────────────────────────────────────────
  const svgElements = data.elements.map(el => {
    const isHighlighted = highlightedIds.includes(el.id);
    const base = renderElement(el, data.elements, activeStep?.id || null, theme, setElementRef);
    if (!base) return null;
    if (isHighlighted) {
      return (
        <g key={el.id} ref={(n) => setHighlightPulseRef(el.id, n)} style={{ transformOrigin: `${el.x}px ${el.y}px`, filter: `drop-shadow(0 0 16px ${el.glowColor || theme.glow})` }}>
          {base}
        </g>
      );
    }
    return base;
  });

  const isLastStep = stepIdx === steps.length - 1;
  const progressPct = steps.length > 0 ? ((stepIdx + 1) / steps.length) * 100 : 0;

  return (
    <div
      className={`rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col ${className}`}
      style={{ background: theme.bg, color: theme.text }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10"
        style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: theme.accent }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
            Mini-Jeu Interactif
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: theme.text + '99' }}>
          {stepIdx >= 0 ? `Étape ${stepIdx + 1} / ${steps.length}` : 'Vue d\'ensemble'}
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full transition-all duration-500 rounded-r-full"
          style={{ width: `${stepIdx < 0 ? 0 : progressPct}%`, background: theme.accent }}
        />
      </div>

      {/* ── SVG Canvas ── */}
      <div className="relative" style={{ background: theme.bg }}>
        <svg
          viewBox="0 0 800 380"
          className="w-full"
          style={{ display: 'block' }}
        >
          <defs>
            {/* Glow filter */}
            <filter id="ca-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Arrowhead marker */}
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill={theme.accent} />
            </marker>
            {/* Radial background gradient */}
            <radialGradient id="ca-bg-grad" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor={theme.glow} stopOpacity="0.08" />
              <stop offset="100%" stopColor={theme.bg} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background ambience */}
          <rect x="0" y="0" width="800" height="380" fill={theme.bg} />
          <rect x="0" y="0" width="800" height="380" fill="url(#ca-bg-grad)" />

          {/* Subtle grid */}
          <g opacity="0.04">
            {Array.from({ length: 16 }, (_, i) => (
              <line key={`vg-${i}`} x1={i * 53} y1="0" x2={i * 53} y2="380" stroke={theme.accent} strokeWidth="0.5" />
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <line key={`hg-${i}`} x1="0" y1={i * 54} x2="800" y2={i * 54} stroke={theme.accent} strokeWidth="0.5" />
            ))}
          </g>

          {/* All elements */}
          {svgElements}

          {/* Active step highlight ring on highlighted elements */}
          {highlightedIds.map(hid => {
            const el = data.elements.find(e => e.id === hid);
            if (!el) return null;
            return (
              <circle
                key={`ring-${hid}`}
                ref={(n) => setHighlightRingRef(hid, n)}
                data-baser={el.radius || 30}
                cx={el.x}
                cy={el.y}
                fill="none"
                stroke={el.color || theme.accent}
                strokeWidth="2"
                strokeDasharray="8,4"
              />
            );
          })}

          {/* Step title overlay */}
          {activeStep && (
            <g>
              <rect x="20" y="20" width="560" height="44" rx="10" fill="rgba(0,0,0,0.55)" />
              <text x="38" y="38" fill={theme.accent} fontSize="11" fontWeight="bold" letterSpacing="1">
                ÉTAPE {stepIdx + 1}
              </text>
              <text x="38" y="56" fill={theme.text} fontSize="15" fontWeight="bold">
                {activeStep.label}
              </text>
            </g>
          )}

          {/* Overview title */}
          {!activeStep && (
            <g>
              <text x="400" y="200" textAnchor="middle" fill={theme.accent} fontSize="22" fontWeight="bold"
                style={{ filter: `drop-shadow(0 0 12px ${theme.glow})` }}>
                {data.title}
              </text>
              <text x="400" y="228" textAnchor="middle" fill={theme.text + '88'} fontSize="13">
                Appuie sur ▶ pour découvrir étape par étape
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* ── Step description panel ── */}
      {activeStep && (
        <div className="px-5 py-4 border-t border-white/10 min-h-[80px]"
          style={{ background: 'rgba(0,0,0,0.35)' }}>
          <p className="text-sm leading-relaxed" style={{ color: theme.text }}>
            {activeStep.description}
          </p>

          {/* Mini-challenge for this step */}
          {activeStep.challenge && (
            <div className="mt-4 rounded-xl p-4 border border-white/10" style={{ background: 'rgba(0,0,0,0.3)' }}>
              
              {/* Type Quiz (Retro-compatibilité) */}
              {(!('type' in activeStep.challenge) || activeStep.challenge.type === 'quiz') && (
                <>
                  <p className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: theme.accent }}>
                    <Zap className="w-3.5 h-3.5" />
                    Micro-défi rapide !
                  </p>
                  <p className="text-sm font-semibold mb-3" style={{ color: theme.text }}>
                    {(activeStep.challenge as any).question}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(activeStep.challenge as any).options.map((opt: string, oi: number) => {
                      const challenge = activeStep.challenge as any;
                      const chosen = quizAnswers[activeStep.id];
                      const isChosen = chosen === oi;
                      const isCorrect = oi === challenge.correct;
                      const answered = chosen !== undefined && chosen !== null;

                      let borderColor = 'rgba(255,255,255,0.15)';
                      let bgColor = 'rgba(255,255,255,0.05)';
                      let textColor = theme.text;
                      let icon = null;

                      if (answered) {
                        if (isCorrect) { borderColor = '#22c55e'; bgColor = 'rgba(34,197,94,0.15)'; textColor = '#86efac'; icon = <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />; }
                        else if (isChosen) { borderColor = '#ef4444'; bgColor = 'rgba(239,68,68,0.15)'; textColor = '#fca5a5'; icon = <XCircle className="w-3.5 h-3.5 shrink-0" />; }
                        else { borderColor = 'rgba(255,255,255,0.08)'; textColor = theme.text + '55'; }
                      } else if (isChosen) {
                        borderColor = theme.accent;
                        bgColor = `${theme.glow}22`;
                      }

                      return (
                        <button
                          key={oi}
                          onClick={() => !answered && handleStepChallenge(activeStep.id, oi)}
                          disabled={answered}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                          style={{ border: `1px solid ${borderColor}`, background: bgColor, color: textColor }}
                        >
                          {icon}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {quizAnswers[activeStep.id] !== undefined && (
                    <p className="mt-2 text-xs" style={{ color: quizAnswers[activeStep.id] === (activeStep.challenge as any).correct ? '#86efac' : '#fca5a5' }}>
                      {quizAnswers[activeStep.id] === (activeStep.challenge as any).correct ? '✅ Correct !' : `❌ La bonne réponse est : "${(activeStep.challenge as any).options[(activeStep.challenge as any).correct]}"`}
                    </p>
                  )}
                </>
              )}

              {/* Type Drag & Drop */}
              {'type' in activeStep.challenge && activeStep.challenge.type === 'drag-drop' && (
                <>
                  <p className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: theme.accent }}>
                    <Zap className="w-3.5 h-3.5" />
                    Glisser-Déposer
                  </p>
                  <p className="text-sm font-semibold mb-4" style={{ color: theme.text }}>
                    {activeStep.challenge.instruction}
                  </p>
                  
                  {/* Éléments à faire glisser */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {activeStep.challenge.draggables.map((item: string, i: number) => {
                      const isPlaced = Object.values(dragAnswers[activeStep.id] || {}).includes(item);
                      return (
                        <div
                          key={i}
                          draggable={!isPlaced}
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-grab active:cursor-grabbing border ${isPlaced ? 'opacity-30' : ''}`}
                          style={{ borderColor: theme.accent, color: theme.text, background: `${theme.glow}33` }}
                        >
                          {item}
                        </div>
                      );
                    })}
                  </div>

                  {/* Zones de dépôt */}
                  <div className="grid grid-cols-2 gap-3">
                    {activeStep.challenge.dropZones.map((zone: any) => {
                      const droppedItem = (dragAnswers[activeStep.id] || {})[zone.id];
                      const isCorrect = droppedItem === zone.expectedDraggable;
                      const borderColor = droppedItem ? (isCorrect ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.2)';
                      const bgColor = droppedItem ? (isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)') : 'rgba(255,255,255,0.05)';
                      
                      return (
                        <div
                          key={zone.id}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const data = e.dataTransfer.getData('text/plain');
                            if (data) {
                              setDragAnswers(prev => ({
                                ...prev,
                                [activeStep.id]: {
                                  ...(prev[activeStep.id] || {}),
                                  [zone.id]: data
                                }
                              }));
                            }
                          }}
                          className="border-dashed border-2 rounded-xl p-3 flex flex-col items-center justify-center min-h-[70px] transition-colors"
                          style={{ borderColor, background: bgColor }}
                        >
                          <span className="text-xs font-semibold mb-1 text-center" style={{ color: theme.text + '99' }}>
                            {zone.label}
                          </span>
                          {droppedItem && (
                            <span className="text-xs font-bold px-2 py-1 rounded bg-black/40" style={{ color: isCorrect ? '#86efac' : '#fca5a5' }}>
                              {droppedItem}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Final Quiz ── */}
      {showFinalQuiz && data.finalQuiz && (
        <div className="px-5 py-5 border-t border-white/10" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <p className="text-sm font-bold mb-1" style={{ color: theme.accent }}>🏆 Quiz Final</p>
          <p className="text-sm font-semibold mb-4" style={{ color: theme.text }}>
            {data.finalQuiz.question}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {data.finalQuiz.options.map((opt, oi) => {
              const answered = finalQuizAnswer !== null;
              const isChosen = finalQuizAnswer === oi;
              const isCorrect = oi === data.finalQuiz!.correct;

              let borderColor = 'rgba(255,255,255,0.15)';
              let bgColor = 'rgba(255,255,255,0.05)';
              let textColor = theme.text;

              if (answered) {
                if (isCorrect) { borderColor = '#22c55e'; bgColor = 'rgba(34,197,94,0.15)'; textColor = '#86efac'; }
                else if (isChosen) { borderColor = '#ef4444'; bgColor = 'rgba(239,68,68,0.15)'; textColor = '#fca5a5'; }
                else { borderColor = 'rgba(255,255,255,0.06)'; textColor = theme.text + '44'; }
              }

              return (
                <button
                  key={oi}
                  onClick={() => !answered && setFinalQuizAnswer(oi)}
                  disabled={answered}
                  className="text-left text-xs font-semibold px-3 py-2.5 rounded-xl transition-all"
                  style={{ border: `1px solid ${borderColor}`, background: bgColor, color: textColor }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {finalQuizAnswer !== null && (
            <div className="rounded-xl p-3 text-xs" style={{
              background: finalQuizAnswer === data.finalQuiz.correct ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${finalQuizAnswer === data.finalQuiz.correct ? '#22c55e44' : '#ef444444'}`,
              color: finalQuizAnswer === data.finalQuiz.correct ? '#86efac' : '#fca5a5',
            }}>
              {finalQuizAnswer === data.finalQuiz.correct ? '🎯 ' : '💡 '}
              {data.finalQuiz.explanation}
            </div>
          )}
        </div>
      )}

      {/* ── Controls ── */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/10"
        style={{ background: 'rgba(0,0,0,0.45)' }}>

        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setStepIdx(i); setIsPlaying(false); }}
              title={s.label}
              className="rounded-full transition-all"
              style={{
                width: stepIdx === i ? 20 : 8,
                height: 8,
                background: stepIdx === i ? theme.accent : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>

        {/* Main controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: theme.text + '77', background: 'rgba(255,255,255,0.06)' }}
            title="Recommencer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrev}
            disabled={stepIdx < 0}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{ color: theme.text, background: 'rgba(255,255,255,0.06)' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(p => !p)}
            className="px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-md flex items-center gap-2"
            style={{ background: theme.accent, color: '#0f172a' }}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : (stepIdx < 0 ? 'Démarrer' : 'Continuer')}
          </button>
          <button
            onClick={handleNext}
            disabled={isLastStep && showFinalQuiz}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{ color: theme.text, background: 'rgba(255,255,255,0.06)' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
