import { useRef, useEffect, useState, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useSessionStore } from '../../stores/sessionStore';
import { ClientEvents } from '@wraith/shared';
import { drawToken, hitTestToken } from './Token';

interface GameMapProps {
  sessionId: string;
}

export function GameMap({ sessionId }: GameMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { emit } = useSocket();
  const { mapState, isStoryteller } = useSessionStore();

  // Local view state (not synced)
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTokenId, setDragTokenId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [fogMode, setFogMode] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  // ST toolbar state
  const [addTokenLabel, setAddTokenLabel] = useState('');
  const [addTokenColor, setAddTokenColor] = useState('#4a90d9');

  // Resize canvas to fill container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasSize({
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    setCanvasSize({ w: container.clientWidth, h: container.clientHeight });

    return () => observer.disconnect();
  }, []);

  // ─── Render ─────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = canvasSize;
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    const gridSize = mapState?.gridSize ?? 40;
    const gridW = mapState?.width ?? 20;
    const gridH = mapState?.height ?? 20;

    // Background color
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, gridW * gridSize, gridH * gridSize);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= gridW; x++) {
      ctx.beginPath();
      ctx.moveTo(x * gridSize, 0);
      ctx.lineTo(x * gridSize, gridH * gridSize);
      ctx.stroke();
    }
    for (let y = 0; y <= gridH; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * gridSize);
      ctx.lineTo(gridW * gridSize, y * gridSize);
      ctx.stroke();
    }

    // Fog of war
    if (mapState?.fogOfWar) {
      for (let row = 0; row < gridH; row++) {
        for (let col = 0; col < gridW; col++) {
          const visible = mapState.fogOfWar[row]?.[col] ?? true;
          if (!visible) {
            // Hidden cell
            ctx.fillStyle = isStoryteller
              ? 'rgba(0,0,0,0.5)'
              : 'rgba(0,0,0,0.95)';
            ctx.fillRect(
              col * gridSize,
              row * gridSize,
              gridSize,
              gridSize,
            );
          }
        }
      }
    }

    // Tokens
    if (mapState?.tokens) {
      for (const token of mapState.tokens) {
        // If fog hides the token and user is not ST, skip
        if (!isStoryteller && mapState.fogOfWar) {
          const visible = mapState.fogOfWar[token.y]?.[token.x] ?? true;
          if (!visible && !token.isVisible) continue;
        }
        drawToken(ctx, token, gridSize, token.id === dragTokenId);
      }
    }

    ctx.restore();
  }, [canvasSize, panX, panY, zoom, mapState, isStoryteller, dragTokenId]);

  useEffect(() => {
    requestAnimationFrame(render);
  }, [render]);

  // ─── Mouse handlers ─────────────────────────────────────────

  const canvasToGrid = (
    clientX: number,
    clientY: number,
  ): { gx: number; gy: number; px: number; py: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const px = (clientX - rect.left - panX) / zoom;
    const py = (clientY - rect.top - panY) / zoom;
    const gridSize = mapState?.gridSize ?? 40;
    return {
      gx: Math.floor(px / gridSize),
      gy: Math.floor(py / gridSize),
      px,
      py,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { gx, gy, px, py } = canvasToGrid(e.clientX, e.clientY);
    const gridSize = mapState?.gridSize ?? 40;

    // Check if clicking on a token
    if (mapState?.tokens) {
      for (let i = mapState.tokens.length - 1; i >= 0; i--) {
        const token = mapState.tokens[i];
        if (hitTestToken(token, px, py, gridSize)) {
          setDragTokenId(token.id);
          setDragStart({ x: e.clientX, y: e.clientY });
          return;
        }
      }
    }

    // Fog toggle (ST only, right-click or fog mode)
    if (fogMode && isStoryteller && mapState) {
      const visible = mapState.fogOfWar[gy]?.[gx];
      if (visible !== undefined) {
        emit(ClientEvents.UPDATE_FOG, {
          sessionId,
          cells: [{ row: gy, col: gx, visible: !visible }],
        });
      }
      return;
    }

    // Pan
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragTokenId) {
      // Optimistic token drag preview handled by re-render
      return;
    }
    if (isDragging) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragTokenId) {
      const { gx, gy } = canvasToGrid(e.clientX, e.clientY);
      emit(ClientEvents.MOVE_TOKEN, {
        sessionId,
        tokenId: dragTokenId,
        x: gx,
        y: gy,
      });
      setDragTokenId(null);
    }
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.3, Math.min(3, z + delta)));
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isStoryteller || !mapState) return;

    const { gx, gy } = canvasToGrid(e.clientX, e.clientY);
    const visible = mapState.fogOfWar[gy]?.[gx];
    if (visible !== undefined) {
      emit(ClientEvents.UPDATE_FOG, {
        sessionId,
        cells: [{ row: gy, col: gx, visible: !visible }],
      });
    }
  };

  // ─── ST Toolbar Actions ─────────────────────────────────────

  const handleAddToken = () => {
    if (!addTokenLabel.trim()) return;
    emit(ClientEvents.ADD_TOKEN, {
      sessionId,
      token: {
        label: addTokenLabel.trim(),
        x: Math.floor((mapState?.width ?? 20) / 2),
        y: Math.floor((mapState?.height ?? 20) / 2),
        color: addTokenColor,
        size: 1,
        isVisible: true,
      },
    });
    setAddTokenLabel('');
  };

  const handleSetBackground = () => {
    emit(ClientEvents.SET_MAP_BG, {
      sessionId,
      backgroundUrl: '',
      gridSize: 40,
      width: 20,
      height: 20,
    });
  };

  return (
    <div className="flex flex-col h-full border border-wraith-800 rounded-lg bg-wraith-900/30 overflow-hidden">
      {/* ST Toolbar */}
      {isStoryteller && (
        <div className="px-3 py-2 border-b border-wraith-800 bg-wraith-900/50 flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSetBackground}
            className="px-2 py-1 text-xs rounded bg-wraith-800 hover:bg-wraith-700 text-gray-400 transition-colors"
          >
            Init Map
          </button>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={addTokenLabel}
              onChange={(e) => setAddTokenLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddToken()}
              placeholder="Token label"
              className="w-24 px-2 py-1 text-xs bg-wraith-800 border border-wraith-700 rounded text-gray-300 placeholder-gray-600 focus:outline-none"
            />
            <input
              type="color"
              value={addTokenColor}
              onChange={(e) => setAddTokenColor(e.target.value)}
              className="w-6 h-6 bg-transparent border-0 cursor-pointer"
            />
            <button
              onClick={handleAddToken}
              className="px-2 py-1 text-xs rounded bg-wraith-800 hover:bg-wraith-700 text-gray-400 transition-colors"
            >
              + Token
            </button>
          </div>
          <button
            onClick={() => setFogMode(!fogMode)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              fogMode
                ? 'bg-amber-900/50 text-amber-300 border border-amber-700/50'
                : 'bg-wraith-800 text-gray-400 hover:bg-wraith-700'
            }`}
          >
            Fog {fogMode ? 'ON' : 'OFF'}
          </button>
        </div>
      )}

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 min-h-0 cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="block"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={handleContextMenu}
        />
      </div>
    </div>
  );
}
