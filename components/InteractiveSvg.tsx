'use client';

import React, { useState, useMemo } from 'react';
import { Maximize2, Minimize2, Hand, MousePointer } from 'lucide-react';

interface Props {
  svgContent: string;
}

/** 
 * Injects a robust JS interaction layer into any SVG.
 * Includes tooltips and interaction gestures.
 */
function buildSrcDoc(svg: string): string {
  // Universal interaction script — works with all our SVG templates
  const interactionScript = `
<script>
(function() {
  // Hide all tooltips initially via inline style (overrides any CSS)
  var allTips = document.querySelectorAll(
    '.gen-tooltip, .bio-tooltip, .code-tooltip, .info-panel, .tooltip, .phys-tooltip'
  );
  allTips.forEach(function(t) { 
    t.style.opacity = '0'; 
    t.style.visibility = 'hidden';
    t.style.transition = 'opacity 0.2s ease-in-out, visibility 0.2s';
  });

  // All clickable groups
  var clickGroups = document.querySelectorAll(
    '.gen-node, .bio-node, .step-node, .phys-node, .planet-click, [cursor="pointer"], g[tabindex="0"]'
  );

  clickGroups.forEach(function(el) {
    el.style.cursor = 'pointer';

    el.addEventListener('click', function(e) {
      e.stopPropagation();

      // Find this node's tooltips
      var myTips = el.querySelectorAll(
        '.gen-tooltip, .bio-tooltip, .code-tooltip, .info-panel, .tooltip, .phys-tooltip'
      );
      var isOpen = myTips.length > 0 && myTips[0].style.opacity === '1';

      // Close ALL tooltips everywhere and remove active states
      document.querySelectorAll(
        '.gen-tooltip, .bio-tooltip, .code-tooltip, .info-panel, .tooltip, .phys-tooltip'
      ).forEach(function(t) { 
        t.style.opacity = '0'; 
        t.style.visibility = 'hidden'; 
      });
      clickGroups.forEach(function(x) { x.classList.remove('active'); });

      // Toggle: open if was closed
      if (!isOpen) {
        el.classList.add('active');
        myTips.forEach(function(t) { 
          t.style.opacity = '1'; 
          t.style.visibility = 'visible'; 
        });
      }
    });
  });

  // Click on background closes all tooltips and removes active states
  document.addEventListener('pointerdown', function(e) {
    if (!e.target.closest('.gen-node, .bio-node, .step-node, .phys-node, .planet-click, g[tabindex="0"]')) {
      document.querySelectorAll(
        '.gen-tooltip, .bio-tooltip, .code-tooltip, .info-panel, .tooltip, .phys-tooltip'
      ).forEach(function(t) { 
        t.style.opacity = '0'; 
        t.style.visibility = 'hidden'; 
      });
      clickGroups.forEach(function(x) { x.classList.remove('active'); });
    }
  });

})();
</script>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%; height: 100%;
      background: #0f172a;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    #svg-wrap {
      width: 100%; height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg {
      width: 100%; height: 100%;
      object-fit: contain;
      display: block;
    }
    /* Cursor hint on hoverable elements */
    .gen-node:hover, .bio-node:hover, .step-node:hover,
    .phys-node:hover, .planet-click:hover, g[tabindex="0"]:hover {
      filter: brightness(1.35);
    }
  </style>
</head>
<body>
  <div id="svg-wrap">
    ${svg}
  </div>
  ${interactionScript}
</body>
</html>`;
}

export default function InteractiveSvg({ svgContent }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const srcDoc = useMemo(() => buildSrcDoc(svgContent), [svgContent]);

  return (
    <div
      className={`relative flex flex-col rounded-xl overflow-hidden border border-border/50 bg-slate-900 shadow-md ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'w-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-white/10 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue bg-brand-blue/10 px-2 py-1 rounded border border-brand-blue/20 flex items-center gap-1.5">
            <Hand className="w-3.5 h-3.5" />
            Schéma Interactif
          </span>
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded">
            <MousePointer className="w-3 h-3" />
            Clique sur les éléments
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Sandboxed iframe */}
      <div className={`relative w-full bg-slate-950 ${isFullscreen ? 'min-h-[80vh]' : 'aspect-video'}`}>
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          sandbox="allow-scripts"
          className="w-full h-full border-none outline-none block"
          title="Schéma Interactif"
        />
      </div>
    </div>
  );
}
