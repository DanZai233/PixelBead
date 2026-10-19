import React, { useEffect, useState } from 'react';

interface AiRecord {
  id: string;
  prompt: string;
  model: string;
  mode: string;
  status: string;
  createdAt: number;
  durationMs?: number;
  error?: string;
  hasImage: boolean;
  hasReferenceImage: boolean;
  request: {
    ip: string;
    userAgent: string;
    platform?: string;
    mobile?: string;
    language?: string;
    country?: string;
    region?: string;
    city?: string;
  };
}

const API = ((import.meta as any).env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api/admin/ai-generations';
const STATUSES: Record<string, string> = {
  pending: '生成中', success: '成功', failed: '失败', archive_failed: '图片留存失败',
};

function deviceLabel(record: AiRecord) {
  const ua = record.request?.userAgent || '';
  const os = /iPhone|iPad|iPod/.test(ua) ? 'iOS'
    : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows'
      : /Macintosh/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : record.request?.platform || '未知系统';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome|CriOS/.test(ua) ? 'Chrome'
    : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'WebView / 其他';
  return `${os} · ${browser}`;
}

export const AdminAiPanel: React.FC<{ token: string; onLogout: () => void }> = ({ token, onLogout }) => {
  const [records, setRecords] = useState<AiRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState('');
  const [preview, setPreview] = useState<{ id: string; kind: 'reference' | 'generated' } | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState('');
  const limit = 15;

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit), search, status });
        const res = await fetch(`${API}?${params}`, {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
        });
        if (res.status === 401) { onLogout(); return; }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '加载记录失败');
        if (!controller.signal.aborted) { setRecords(data.records); setTotal(data.total); }
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : '加载记录失败');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [token, page, search, status, revision, onLogout]);

  useEffect(() => {
    setImageUrl('');
    setImageError('');
    if (!preview) return;
    const controller = new AbortController();
    let objectUrl = '';
    const load = async () => {
      try {
        const params = new URLSearchParams({ id: preview.id, image: preview.kind });
        const res = await fetch(`${API}?${params}`, {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
        });
        if (res.status === 401) { onLogout(); return; }
        if (!res.ok) throw new Error('图片加载失败，请重试');
        const blob = await res.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (err) {
        if (!controller.signal.aborted) setImageError(err instanceof Error ? err.message : '图片加载失败');
      }
    };
    void load();
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setPreview(null); };
    window.addEventListener('keydown', close);
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      window.removeEventListener('keydown', close);
    };
  }, [preview, token, onLogout]);

  const remove = async (record: AiRecord) => {
    if (!window.confirm('确定删除这条生成记录及其参考图、生成图？')) return;
    setDeleting(record.id);
    setError('');
    try {
      const res = await fetch(`${API}?id=${record.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { onLogout(); return; }
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || '删除失败'); }
      if (records.length === 1 && page > 1) setPage(p => p - 1);
      else setRevision(r => r + 1);
    } catch (err) { setError(err instanceof Error ? err.message : '删除失败'); }
    finally { setDeleting(''); }
  };

  const selected = records.find(r => r.id === preview?.id);
  const pages = Math.max(1, Math.ceil(total / limit));
  const buttonClass = 'px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40';

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3">
      <input aria-label="搜索描述或 IP" placeholder="搜索描述或 IP" value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        className="min-w-0 flex-1 basis-52 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
      <select aria-label="生成状态" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
        <option value="">全部状态</option>
        {Object.entries(STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <button className={buttonClass} onClick={() => setRevision(r => r + 1)}>刷新</button>
      <span className="text-xs text-slate-500">共 {total} 条</span>
    </div>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {loading ? <p role="status" className="py-12 text-center text-slate-500">加载中...</p>
      : !records.length ? <p className="py-12 text-center text-slate-500">{error ? '记录未加载' : '暂无生成记录'}</p>
        : <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>{['用户输入', '图片', '状态 / 耗时', 'IP / 地区', '设备', '时间', '操作'].map(h =>
                <th key={h} className="p-3 whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody>{records.map(record => <tr key={record.id} className="border-t border-slate-100 align-top">
              <td className="p-3 min-w-[220px] max-w-sm">
                <p className="whitespace-pre-wrap break-words text-slate-800 max-h-40 overflow-auto">{record.prompt || '（仅上传参考图）'}</p>
                <p className="mt-2 text-xs text-slate-400 break-all">{record.mode === 'image' ? '参考图生成' : '文字生成'} · {record.model}</p>
              </td>
              <td className="p-3 space-y-2 whitespace-nowrap">
                {record.hasImage && <button className={buttonClass} onClick={() => setPreview({ id: record.id, kind: 'generated' })}>查看生成图</button>}
                {record.hasReferenceImage && <div><button className={buttonClass} onClick={() => setPreview({ id: record.id, kind: 'reference' })}>查看参考图</button></div>}
                {!record.hasImage && !record.hasReferenceImage && <span className="text-slate-400">无图片</span>}
              </td>
              <td className="p-3 min-w-[140px]">
                <span className={record.status === 'success' ? 'text-emerald-600' : record.status === 'pending' ? 'text-slate-500' : 'text-red-600'}>
                  {record.status === 'pending' && Date.now() - record.createdAt > 180000 ? '超时 / 未完成' : STATUSES[record.status] || record.status}
                </span>
                {record.durationMs !== undefined && <p className="text-xs text-slate-400 mt-1">{(record.durationMs / 1000).toFixed(1)} 秒</p>}
                {record.error && <p className="mt-1 text-xs text-red-500 break-words">{record.error}</p>}
              </td>
              <td className="p-3 min-w-[160px]">
                <p className="break-all">{record.request?.ip || '未知'}</p>
                <p className="text-xs text-slate-400 mt-1">{[record.request?.country, record.request?.region, record.request?.city].filter(Boolean).join(' / ') || '地区未知'}</p>
              </td>
              <td className="p-3 min-w-[180px] max-w-xs">
                <p>{deviceLabel(record)}</p>
                <details className="mt-1 text-xs text-slate-500"><summary className="cursor-pointer">请求信息</summary>
                  <p className="break-all mt-1">{record.request?.userAgent || '未提供 User-Agent'}</p>
                  <p className="mt-1 break-all">{record.request?.language}</p>
                </details>
              </td>
              <td className="p-3 text-xs text-slate-500 whitespace-nowrap">{new Date(record.createdAt).toLocaleString('zh-CN')}</td>
              <td className="p-3"><button className={`${buttonClass} text-red-600`}
                disabled={deleting === record.id || (record.status === 'pending' && Date.now() - record.createdAt < 180000)} onClick={() => void remove(record)}>
                {deleting === record.id ? '删除中...' : '删除'}
              </button></td>
            </tr>)}</tbody>
          </table>
        </div>}
    <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
      <span>第 {page} / {pages} 页</span>
      <div className="flex gap-2">
        <button className={buttonClass} disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)}>上一页</button>
        <button className={buttonClass} disabled={loading || page >= pages} onClick={() => setPage(p => p + 1)}>下一页</button>
      </div>
    </div>
    {preview && <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
      <div role="dialog" aria-modal="true" aria-label={preview.kind === 'generated' ? '生成图' : '参考图'}
        className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto p-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-bold">{preview.kind === 'generated' ? '生成图' : '参考图'}</h2>
          <div className="flex gap-2">
            {imageUrl && <a className={buttonClass} href={imageUrl} download={`ai-${preview.id}-${preview.kind}`}>下载图片</a>}
            <button autoFocus className={buttonClass} onClick={() => setPreview(null)}>关闭</button>
          </div>
        </div>
        {imageError ? <p role="alert" className="text-red-600">{imageError}</p> : imageUrl
          ? <img src={imageUrl} alt={preview.kind === 'generated' ? 'AI 生成图片' : '用户参考图片'} className="w-full max-h-[65vh] object-contain" />
          : <p className="py-12 text-center text-slate-500">加载图片中...</p>}
        <p className="mt-3 text-sm whitespace-pre-wrap break-words">{selected?.prompt}</p>
      </div>
    </div>}
  </div>;
};
