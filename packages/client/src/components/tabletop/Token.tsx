import type { MapToken } from '@wraith/shared';

/**
 * Draw a token on a canvas context.
 * `gridSize` is the pixel size of each grid cell.
 */
export function drawToken(
  ctx: CanvasRenderingContext2D,
  token: MapToken,
  gridSize: number,
  isActive: boolean,
): void {
  const cx = token.x * gridSize + gridSize / 2;
  const cy = token.y * gridSize + gridSize / 2;
  const radius = (gridSize * token.size) / 2 - 2;

  // Circle fill
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = token.color;
  ctx.fill();

  // Border
  ctx.strokeStyle = isActive ? '#f59e0b' : 'rgba(255,255,255,0.3)';
  ctx.lineWidth = isActive ? 3 : 1;
  ctx.stroke();

  // Label (first 3 chars)
  const label = token.label.substring(0, 3).toUpperCase();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.max(10, gridSize * 0.3)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cy);
}

/**
 * Hit-test: is (px, py) inside a token?
 */
export function hitTestToken(
  token: MapToken,
  px: number,
  py: number,
  gridSize: number,
): boolean {
  const cx = token.x * gridSize + gridSize / 2;
  const cy = token.y * gridSize + gridSize / 2;
  const radius = (gridSize * token.size) / 2;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}
