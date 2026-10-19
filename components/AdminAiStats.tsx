import React from 'react';
import type { UsageStats } from '../types/adminAi';

export const AdminAiStats: React.FC<{
  data: UsageStats; page: number; onPage: (page: number) => void; onIp: (ip: string) => void;
}> = ({ data, page, onPage, onIp }) => {
  const { summary: s } = data;
  const completed = s.generated + s.failed + s.timeout;
  const max = Math.max(1, ...data.daily.map(day => day.requests));
  const pages = Math.max(1, Math.ceil(s.uniqueIps / 20));
  const time = (value: number) => new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const button = 'px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs disabled:opacity-40';
  return <div className="space-y-6">
    <p className="text-xs text-slate-500">AI 生图审计 · 日期按北京时间 · 独立 IP 不等于真实用户人数，共享网络可能合并，切换网络可能重复。仅统计已留存的生成请求，删除记录会同步影响统计。</p>
    <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 border-y border-slate-200 py-4">
      {[
        ['生成请求', s.requests], ['活跃独立 IP', s.uniqueIps], ['已生成图片', s.generated],
        ['生成成功率', completed ? `${(s.generated / completed * 100).toFixed(1)}%` : '—'],
        ['生成失败', s.failed], ['超时 / 未完成', s.timeout], ['生成中', s.pending],
        ['平均成功耗时', s.avgDurationMs == null ? '—' : `${(s.avgDurationMs / 1000).toFixed(1)} 秒`],
      ].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-xl font-bold text-slate-900">{value}</dd></div>)}
    </dl>
    <p className="text-xs text-slate-500">文字生成 {s.text} 次 · 参考图生成 {s.image} 次 · 图片留存失败 {s.archiveFailed} 次（计入已生成）· 成功率排除生成中请求，超时计为未成功。</p>
    <section>
      <h2 className="text-sm font-bold mb-3">每日用量</h2>
      {!data.daily.length ? <p className="text-sm text-slate-400">暂无数据</p> : <div className="overflow-x-auto">
        <div className="flex items-end gap-1 h-32 border-b border-slate-200" style={{ minWidth: Math.max(280, data.daily.length * 18) }}>
          {data.daily.map(day => <div key={day._id} className="flex-1 max-w-8 h-full flex items-end" title={`${day._id}：${day.requests} 次，已生成 ${day.generated} 次`}>
            <div role="img" aria-label={`${day._id}：${day.requests} 次`} className="w-full bg-emerald-500 hover:bg-emerald-600" style={{ height: `${Math.max(2, day.requests / max * 100)}%` }} />
          </div>)}
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-2"><span>{data.daily[0]._id}</span>{data.daily.length > 1 && <span>{data.daily.at(-1)?._id}</span>}</div>
      </div>}
      <p className="mt-2 text-xs text-slate-400">展示最近 366 个有请求的日期。</p>
    </section>
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
      {([['设备系统', data.devices], ['国家 / 地区', data.countries], ['模型用量', data.models], ['失败原因', data.errors]] as const).map(([title, rows]) => <section key={title} className="min-w-0">
        <h2 className="text-sm font-bold mb-2">{title}</h2>
        {!rows.length ? <p className="text-xs text-slate-400">暂无数据</p> : <ul className="divide-y divide-slate-100 text-xs">{rows.map(row => <li key={row._id} className="flex justify-between gap-3 py-2"><span className="break-all">{row._id || '未知'}</span><span className="shrink-0 text-slate-500">{row.requests} 次</span></li>)}</ul>}
      </section>)}
    </div>
    <section>
      <h2 className="text-sm font-bold mb-3">IP 使用明细</h2>
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs text-left bg-white">
          <thead className="bg-slate-50 text-slate-500"><tr>{['IP / 最近地区', '请求 / 已生成', '失败 / 超时', '文字 / 参考图', '区间首次 / 最近使用', '最近设备', '操作'].map(label => <th key={label} className="p-3 whitespace-nowrap">{label}</th>)}</tr></thead>
          <tbody>{data.users.map(user => <tr key={user._id} className="border-t border-slate-100 align-top">
            <td className="p-3 min-w-[160px] break-all">{user._id}<p className="text-slate-400 mt-1">{[user.request?.country, user.request?.region, user.request?.city].filter(Boolean).join(' / ') || '地区未知'}</p></td>
            <td className="p-3 whitespace-nowrap">{user.requests} / {user.generated}</td>
            <td className="p-3 whitespace-nowrap">{user.failed} / {user.timeout}</td>
            <td className="p-3 whitespace-nowrap">{user.text} / {user.image}</td>
            <td className="p-3 whitespace-nowrap">{time(user.firstSeen)}<p className="text-slate-400 mt-1">{time(user.lastSeen)}</p></td>
            <td className="p-3 min-w-[160px] max-w-xs"><details><summary className="cursor-pointer">User-Agent</summary><p className="break-all mt-1">{user.request?.userAgent || '未知'}</p></details></td>
            <td className="p-3 whitespace-nowrap"><button className={button} onClick={() => onIp(user._id)}>查看记录</button></td>
          </tr>)}{!data.users.length && <tr><td colSpan={7} className="p-6 text-center text-slate-400">暂无可识别 IP</td></tr>}</tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-3 text-xs text-slate-500"><span>第 {page} / {pages} 页</span><div className="flex gap-2"><button className={button} disabled={page <= 1} onClick={() => onPage(page - 1)}>上一页</button><button className={button} disabled={page >= pages} onClick={() => onPage(page + 1)}>下一页</button></div></div>
    </section>
    <details className="text-xs text-slate-500"><summary className="cursor-pointer">每日统计明细</summary><div className="overflow-x-auto mt-3"><table className="w-full text-left"><thead><tr>{['日期', '请求', '已生成', '失败', '超时', '文字', '参考图'].map(h => <th key={h} className="p-2 whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{data.daily.map(day => <tr key={day._id} className="border-t border-slate-100">{[day._id, day.requests, day.generated, day.failed, day.timeout, day.text, day.image].map((value, i) => <td key={i} className="p-2 whitespace-nowrap">{value}</td>)}</tr>)}</tbody></table></div></details>
  </div>;
};
