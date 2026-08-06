import { useState, useCallback, useEffect } from 'react';

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

export function useFeedback() {
  const [shouldShow, setShouldShow] = useState(false);
  const [source, setSource] = useState('');
  const [feedback, setFeedback] = useState<FeedbackEntry[]>(loadFeedback);

  useEffect(() => {
    const pending = sessionStorage.getItem('pixelbead_feedback_pending');
    if (pending) {
      sessionStorage.removeItem('pixelbead_feedback_pending');
      try { const s = JSON.parse(pending); tryShow(s.source); } catch {}
    }
  }, []);

  const tryShow = useCallback((triggerSource: string) => {
    const lastShown = localStorage.getItem(LAST_SHOWN_KEY);
    const now = Date.now();
    if (lastShown && now - parseInt(lastShown) < RATE_LIMIT_MS) return;
    setSource(triggerSource);
    setShouldShow(true);
    localStorage.setItem(LAST_SHOWN_KEY, String(now));
  }, []);

  const requestShow = useCallback((triggerSource: string) => {
    sessionStorage.setItem('pixelbead_feedback_pending', JSON.stringify({ source: triggerSource }));
  }, []);

  const close = useCallback(() => {
    setShouldShow(false);
  }, []);

  const submit = useCallback((suggestion: string, contact: string) => {
    const entry: FeedbackEntry = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      suggestion,
      contact,
      createdAt: Date.now(),
      source,
    };
    setFeedback(prev => {
      const next = [entry, ...prev];
      saveFeedback(next);
      return next;
    });
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

  return { shouldShow, source, feedback, tryShow, requestShow, close, submit, getMailtoUrl };
}
