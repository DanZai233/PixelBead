// Project serialization/deserialization utilities
// Handles conversion between canvas state and JSON format for save/load/import/export

import { PixelStyle } from '../types/shared';
import type { ColorHex } from '../types/shared';

/**
 * Project data structure
 * Represents a saved project with metadata and canvas state
 */
export interface Project {
  id: string;
  name: string;
  gridSize: { width: number; height: number };
  grid: Record<string, string>; // Key: "x,y", Value: color hex
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * Project export format
 * Used for JSON import/export (portable format without metadata)
 */
export interface ProjectExport {
  name: string;
  gridSize: { width: number; height: number };
  grid: Record<string, string>;
  pixelStyle: PixelStyle;
  version: string; // Format version for future compatibility
}

/**
 * Serialize canvas state to export format
 * @param canvasState - Current canvas state from useCanvasStore
 * @param name - Project name
 * @returns Project export data ready for JSON serialization
 */
export function serializeProject(
  canvasState: {
    grid: Map<string, string>;
    gridSize: { width: number; height: number };
    pixelStyle: PixelStyle;
  },
  name: string
): ProjectExport {
  // Convert Map to plain object for JSON serialization
  const gridObject = Object.fromEntries(canvasState.grid.entries());

  return {
    name,
    gridSize: canvasState.gridSize,
    grid: gridObject,
    pixelStyle: canvasState.pixelStyle,
    version: '1.0',
  };
}

/**
 * Deserialize project data to canvas state
 * @param data - Project export data
 * @returns Partial canvas state (gridSize, grid)
 */
export function deserializeProject(
  data: ProjectExport
): {
  gridSize: { width: number; height: number };
  grid: Map<string, string>;
  pixelStyle: PixelStyle;
} {
  // Convert grid object back to Map
  const gridMap = new Map<string, string>();
  for (const [key, value] of Object.entries(data.grid)) {
    gridMap.set(key, value);
  }

  return {
    gridSize: data.gridSize,
    grid: gridMap,
    pixelStyle: data.pixelStyle || PixelStyle.CIRCLE,
  };
}

/**
 * Generate unique project ID
 * Uses timestamp + random component for uniqueness
 * @returns Unique project ID string
 */
export function generateProjectId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
}

/**
 * Validate project data structure
 * @param data - Data to validate
 * @returns True if valid, false otherwise
 */
export function validateProjectData(data: unknown): data is ProjectExport {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const project = data as Record<string, unknown>;

  // Check required fields
  if (
    typeof project.name !== 'string' ||
    typeof project.gridSize !== 'object' ||
    project.gridSize === null ||
    typeof project.grid !== 'object' ||
    project.grid === null ||
    typeof project.version !== 'string'
  ) {
    return false;
  }

  const gridSize = project.gridSize as Record<string, unknown>;

  // Check grid size limits (4-200 pixels)
  if (
    typeof gridSize.width !== 'number' ||
    typeof gridSize.height !== 'number' ||
    gridSize.width < 4 ||
    gridSize.width > 200 ||
    gridSize.height < 4 ||
    gridSize.height > 200
  ) {
    return false;
  }

  // Check grid structure (all values should be valid color hex codes)
  for (const [key, value] of Object.entries(project.grid)) {
    if (typeof key !== 'string' || typeof value !== 'string') {
      return false;
    }

    // Validate key format ("x,y")
    const [x, y] = key.split(',').map(Number);
    if (isNaN(x) || isNaN(y) || x < 0 || y < 0) {
      return false;
    }

    // Validate color hex format (#RRGGBB)
    if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
      return false;
    }
  }

  return true;
}

/**
 * Format timestamp to relative time string
 * @param timestamp - ISO 8601 timestamp string
 * @returns Relative time (e.g., "2 hours ago", "Yesterday")
 */
export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) {
    return 'Just now';
  }

  if (diffMin < 60) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  // Format date for older entries (e.g., "Mar 28")
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
