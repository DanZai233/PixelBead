import React, { useState, useCallback, useEffect } from 'react';

interface FeedbackItem {
  id: string;
  suggestion: string;
  contact: string;
  source: string;
  createdAt: number;
}

interface AdminFeedbackPanelProps {
  token: string | null;
  onLogout: () => void;
}

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || '';

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0') + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

export const AdminFeedbackPanel: React.FC<AdminFeedbackPanelProps> = ({ token, onLogout }) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const LIMIT = 15;

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token,
  }), [token]);

  const loadFeedback = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      const base = API_BASE ? API_BASE.replace(/\/$/, '') : '';
      const resp = await fetch(base + '/api/admin/feedback?' + params, { headers: authHeaders() });
      if (resp.status === 401) { onLogout(); return; }
      const data = await resp.json();
      setFeedbacks(data.feedbacks);
      setTotal(data.total);
    } catch (err) {
      console.error('加载反馈失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, page, authHeaders, onLogout]);

  useEffect(() => { loadFeedback(); }, [loadFeedback]);

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条反馈？')) return;
    try {
      const base = API_BASE ? API_BASE.replace(/\/$/, '') : '';
      await fetch(base + '/api/admin/feedback', {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ id }),
      });
      loadFeedback();
    } catch (err) { console.error(err); }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
    </div>;
  }

  if (feedbacks.length === 0) {
    return <div className="text-center py-20 text-slate-400">
      <p className="text-lg font-bold">暂无反馈</p>
      <p className="text-sm mt-1">用户的反馈建议将显示在这里</p>
    </div>;
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-bold text-slate-600 text-xs uppercase tracking-wider">建议内容</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600 text-xs uppercase tracking-wider">联系方式</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600 text-xs uppercase tracking-wider">来源</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600 text-xs uppercase tracking-wider">时间</th>
                <th className="px-4 py-3 text-center font-bold text-slate-600 text-xs uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map(f => (
                <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 max-w-[400px] whitespace-pre-wrap">{f.suggestion}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{f.contact || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium">{f.source || '-'}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{formatDate(f.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleDelete(f.id)}
                      className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-xs text-slate-500">第 {page} 页 / 共 {totalPages} 页</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 disabled:opacity-40 transition-all">
                上一页
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * LIMIT >= total}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 disabled:opacity-40 transition-all">
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
