import { useState, useCallback } from 'react';

export interface FeedbackEntry {
  id: string;
  suggestion: string;
  contact: string;
  createdAt: number;
  source: string;
}

const STORAGE_KEY = 'pixelbead_feedback';
const LAST_SHOWN_KEY = 'pixelbead_feedback_last_shown';
const RATE_LIMIT_MS = 24 * 60 * 60 * 1000;

function loadFeedback(): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as FeedbackEntry[] : [];
  } catch {
    return [];
  }
}

function saveFeedback(items: FeedbackEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || '';

async function submitToServer(suggestion: string, contact: string, source: string): Promise<boolean> {
  try {
    const url = API_BASE ? API_BASE.replace(/\/$/, '') + '/api/feedback' : '/api/feedback';
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestion, contact, source }),
    });
    return resp.ok;
  } catch {
    return false; // network error, localStorage fallback is fine
  }
}

export function useFeedback() {
  const [shouldShow, setShouldShow] = useState(false);
  const [source, setSource] = useState('');
  const [feedback, setFeedback] = useState<FeedbackEntry[]>(loadFeedback);

  const tryShow = useCallback((triggerSource: string) => {
    const lastShown = localStorage.getItem(LAST_SHOWN_KEY);
    const now = Date.now();
    if (lastShown && now - parseInt(lastShown) < RATE_LIMIT_MS) return;
    setSource(triggerSource);
    setShouldShow(true);
    localStorage.setItem(LAST_SHOWN_KEY, String(now));
  }, []);

  const close = useCallback(() => {
    setShouldShow(false);
  }, []);

  const submit = useCallback(async (suggestion: string, contact: string) => {
    const entry: FeedbackEntry = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      suggestion,
      contact,
      createdAt: Date.now(),
      source,
    };
    // Always save locally
    setFeedback(prev => {
      const next = [entry, ...prev];
      saveFeedback(next);
      return next;
    });
    // Submit to server (fire-and-forget)
    submitToServer(suggestion, contact, source);
    setShouldShow(false);
  }, [source]);

  const getMailtoUrl = useCallback((suggestion: string, contact: string) => {
    const lines = [
      encodeURIComponent('建议/意见：'),
      encodeURIComponent(suggestion),
      '',
      encodeURIComponent('联系方式：' + contact),
      '',
      encodeURIComponent('触发来源：' + source),
    ];
    const body = lines.join('%0A');
    const subject = encodeURIComponent('拼豆糕手 用户反馈');
    return 'mailto:932351233@qq.com?subject=' + subject + '&body=' + body;
  }, [source]);

  return { shouldShow, source, feedback, tryShow, close, submit, getMailtoUrl };
}
