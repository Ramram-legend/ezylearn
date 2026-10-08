'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { InteractiveVisualization } from '@/types/database';
import { Maximize2, Minimize2, Loader2, RefreshCw } from 'lucide-react';

interface Props {
  visualization: InteractiveVisualization;
}

export default function InteractiveVisualizer({ visualization }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate safe HTML content for the iframe srcDoc
  const generateSrcDoc = () => {
    const baseHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              width: 100vw; 
              height: 100vh; 
              overflow: hidden; 
              background-color: #0f172a; 
              color: white;
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            #viz-root {
              width: 100%;
              height: 100%;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            /* SVG styling for high-end rendering */
            svg { 
              width: 100%; 
              height: 100%; 
              max-width: 100%; 
              max-height: 100%; 
              display: block;
              object-fit: contain;
            }
            img {
              max-width: 100%;
              border-radius: 12px;
              object-fit: cover;
            }
          </style>
        </head>
        <body>
          <!-- Shared Fallback Filters for SVGs -->
          <svg style="position: absolute; width: 0; height: 0; overflow: hidden;" aria-hidden="true">
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="silverGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </svg>

          <div id="viz-root">
            ${visualization.type === 'svg' ? visualization.code : ''}
          </div>
          ${visualization.type === 'threejs' ? visualization.code : ''}
          
          <script>
            // Tell parent we are loaded
            window.onload = () => {
              window.parent.postMessage({ type: 'VIZ_LOADED' }, '*');
            };
            
            // Catch errors
            window.onerror = function(msg, url, lineNo, columnNo, error) {
              window.parent.postMessage({ type: 'VIZ_ERROR', message: msg }, '*');
              return false;
            };
          </script>
        </body>
      </html>
    `;
    return baseHtml;
  };

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // Allow from null origin (sandbox without allow-same-origin sets origin to "null")
      if (e.origin !== "null" && e.origin !== window.location.origin) return;
      
      if (e.data?.type === 'VIZ_LOADED') {
        setIsLoading(false);
      } else if (e.data?.type === 'VIZ_ERROR') {
        setIsLoading(false);
        setError("Une erreur est survenue lors de l'exécution de la visualisation.");
        console.error("Iframe Error:", e.data.message);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Fallback loading state clear after 2 seconds
    const fallbackTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(fallbackTimeout);
    };
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleReload = () => {
    setIsLoading(true);
    setError(null);
    if (iframeRef.current) {
      // Force reload by re-assigning srcDoc
      iframeRef.current.srcdoc = generateSrcDoc();
    }
  };

  return (
    <div className={`flex flex-col rounded-xl overflow-hidden border border-border/50 bg-slate-900 shadow-md ${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'relative w-full aspect-video my-6'}`}>
      
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-white/10 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded">
            {visualization.type === 'threejs' ? '3D Interactive' : '2D Interactive'}
          </span>
          <div className="flex gap-2">
            {visualization.controls?.map(c => (
              <span key={c} className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReload} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Recharger">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main viewer area */}
      <div className="relative flex-1 w-full bg-slate-950 overflow-hidden">
        
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 text-brand-blue">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-sm font-medium animate-pulse">Chargement de la simulation...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 text-red-400 p-6 text-center">
            <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 max-w-sm">
              <p className="font-bold mb-2">⚠️ Échec de la simulation</p>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* 
          SECURITY COMPLIANCE:
          sandbox="allow-scripts": Scripts can run, but cannot access parent DOM or cookies.
          MISSING "allow-same-origin": Origin is forced to "null", preventing API/Fetch abuse using user's session.
        */}
        <iframe
          ref={iframeRef}
          srcDoc={generateSrcDoc()}
          sandbox="allow-scripts"
          className="w-full h-full border-none outline-none"
          title={visualization.caption || "Simulation Interactive"}
        />
      </div>

      {/* Footer Caption */}
      {visualization.caption && (
        <div className="px-4 py-2.5 bg-slate-900 border-t border-white/5 text-xs text-slate-400 text-center">
          {visualization.caption}
        </div>
      )}
    </div>
  );
}
