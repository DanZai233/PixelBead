import React, { useState, useEffect, useCallback } from 'react';

interface AdminMaterial {
  id: string;
  title: string;
  description: string;
  author: string;
  tags: string[];
  gridWidth: number;
  gridHeight: number;
  pixelStyle: string;
  createdAt: number;
  views: number;
  likes: number;
}

interface AdminPanelProps {
  onBack: () => void;
}

const API_BASE = '/api';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('admin_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [materials, setMaterials] = useState<AdminMaterial[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', author: '', tags: '' });

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const LIMIT = 15;

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }), [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const resp = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setLoginError(data.error || '登录失败');
        return;
      }
      sessionStorage.setItem('admin_token', data.token);
      setToken(data.token);
    } catch {
      setLoginError('网络错误，请重试');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setToken(null);
  };

  const loadMaterials = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search.trim()) params.set('search', search.trim());
      const resp = await fetch(`${API_BASE}/admin/materials?${params}`, { headers: authHeaders() });
      if (resp.status === 401) {
        handleLogout();
        return;
      }
      const data = await resp.json();
      setMaterials(data.materials);
      setTotal(data.total);
    } catch (err) {
      console.error('加载失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, page, search, authHeaders]);

  useEffect(() => { loadMaterials(); }, [loadMaterials]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_BASE}/admin/materials`, {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ id }),
      });
      setDeleteConfirm(null);
      loadMaterials();
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const startEdit = (m: AdminMaterial) => {
    setEditingId(m.id);
    setEditForm({
      title: m.title,
      description: m.description,
      author: m.author,
      tags: m.tags.join(', '),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await fetch(`${API_BASE}/admin/materials`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          id: editingId,
          title: editForm.title,
          description: editForm.description,
          author: editForm.author,
          tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      setEditingId(null);
      loadMaterials();
    } catch (err) {
      console.error('更新失败:', err);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Login screen
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-3">🔐</div>
              <h1 className="text-2xl font-black text-slate-900">素材管理后台</h1>
              <p className="text-sm text-slate-400 mt-1">请登录管理员账号</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">用户名</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="admin"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  required
                />
              </div>
              {loginError && (
                <div className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg font-medium">{loginError}</div>
              )}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoggingIn ? '登录中...' : '登 录'}
              </button>
            </form>
            <button
              onClick={onBack}
              className="w-full mt-4 py-2.5 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
            >
              ← 返回编辑器
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg">🔧</div>
            <div>
              <h1 className="text-lg font-black text-slate-900">素材管理后台</h1>
              <p className="text-xs text-slate-400">共 {total} 个素材</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all">
              ← 编辑器
            </button>
            <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-red-600 hover:text-white bg-red-50 hover:bg-red-500 rounded-lg transition-all">
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Search bar */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="搜索素材名称、作者、标签..."
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all pl-10"
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg font-bold">暂无素材</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-bold text-slate-600 text-xs uppercase tracking-wider">素材</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600 text-xs uppercase tracking-wider">作者</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600 text-xs uppercase tracking-wider">尺寸</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600 text-xs uppercase tracking-wider">标签</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600 text-xs uppercase tracking-wider">浏览</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600 text-xs uppercase tracking-wider">点赞</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600 text-xs uppercase tracking-wider">创建时间</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600 text-xs uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map(m => (
                    <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        {editingId === m.id ? (
                          <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full px-2 py-1 border border-indigo-300 rounded text-sm outline-none focus:ring-1 focus:ring-indigo-400" />
                        ) : (
                          <div>
                            <div className="font-bold text-slate-900">{m.title}</div>
                            <div className="text-xs text-slate-400 truncate max-w-[200px]">{m.description}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {editingId === m.id ? (
                          <input value={editForm.author} onChange={e => setEditForm({ ...editForm, author: e.target.value })}
                            className="w-full px-2 py-1 border border-indigo-300 rounded text-sm outline-none focus:ring-1 focus:ring-indigo-400" />
                        ) : m.author}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{m.gridWidth}×{m.gridHeight}</td>
                      <td className="px-4 py-3">
                        {editingId === m.id ? (
                          <input value={editForm.tags} onChange={e => setEditForm({ ...editForm, tags: e.target.value })}
                            className="w-full px-2 py-1 border border-indigo-300 rounded text-sm outline-none focus:ring-1 focus:ring-indigo-400"
                            placeholder="逗号分隔" />
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {m.tags.slice(0, 3).map(t => (
                              <span key={t} className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs font-medium">{t}</span>
                            ))}
                            {m.tags.length > 3 && <span className="text-xs text-slate-400">+{m.tags.length - 3}</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">{m.views}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{m.likes}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{formatDate(m.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {editingId === m.id ? (
                            <>
                              <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors">保存</button>
                              <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors">取消</button>
                            </>
                          ) : deleteConfirm === m.id ? (
                            <>
                              <button onClick={() => handleDelete(m.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors">确认删除</button>
                              <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors">取消</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(m)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">编辑</button>
                              <button onClick={() => setDeleteConfirm(m.id)} className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">删除</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-500">第 {page} / {totalPages} 页，共 {total} 条</p>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    上一页
                  </button>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
