import { useState, useCallback } from 'react';

export interface GenHistoryItem {
  id: string;
  imageDataUrl: string;
  prompt: string;
  referenceImage: string | null;
  gridWidth: number;
  gridHeight: number;
  createdAt: number;
}

const STORAGE_KEY = 'pixelbead_gen_history';
const MAX_ITEMS = 20;

function loadHistory(): GenHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GenHistoryItem[];
  } catch {
    return [];
  }
}

function saveHistory(items: GenHistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch { /* ignore quota */ }
}

export function useGenerationHistory() {
  const [history, setHistory] = useState<GenHistoryItem[]>(loadHistory);

  const addToHistory = useCallback((item: Omit<GenHistoryItem, 'id' | 'createdAt'>) => {
    const newItem: GenHistoryItem = {
      ...item,
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      createdAt: Date.now(),
    };
    setHistory(prev => {
      const next = [newItem, ...prev];
      saveHistory(next);
      return next;
    });
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const next = prev.filter(h => h.id !== id);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  return { history, addToHistory, removeFromHistory, clearHistory };
}
