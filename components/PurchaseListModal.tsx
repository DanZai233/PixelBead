import React, { useMemo, useState } from 'react';
import colorSystemMapping from '../colorSystemMapping.json';
import { colorSystemOptions } from '../utils/colorSystemUtils';
import type { ColorSystem } from '../types';

interface PurchaseListModalProps {
  projectName: string;
  stats: Array<{ hex: string; count: number }>;
  selectedColorSystem: ColorSystem;
  onClose: () => void;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type PackageSize = '50' | '100' | '250' | '500';

interface PurchaseRow {
  hex: string;
  count: number;
  percentage: number;
  key: string;
  mapped: boolean;
  packs: Record<PackageSize, number>;
}

const BEAD_WEIGHT_G = 0.1;
const PACKAGE_SIZES: Array<{ value: PackageSize; label: string; beads: number }> = [
  { value: '50', label: '50g', beads: 500 },
  { value: '100', label: '100g', beads: 1000 },
  { value: '250', label: '250g', beads: 2500 },
  { value: '500', label: '500g', beads: 5000 },
];

const formatKey = (key: string) => key || '未映射';

const escapeCsvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const PurchaseListModal: React.FC<PurchaseListModalProps> = ({
  projectName,
  stats,
  selectedColorSystem,
  onClose,
  onToast,
}) => {
  const [packageSize, setPackageSize] = useState<PackageSize>('50');
  const [scope, setScope] = useState<'current' | 'all'>('current');

  const totalBeadCount = useMemo(
    () => stats.reduce((total, item) => total + item.count, 0),
    [stats],
  );

  const currentRows = useMemo<PurchaseRow[]>(() => stats.map(item => {
    const key = colorSystemMapping[item.hex as keyof typeof colorSystemMapping]?.[selectedColorSystem] || '';
    return {
      hex: item.hex,
      count: item.count,
      percentage: totalBeadCount ? item.count / totalBeadCount : 0,
      key,
      mapped: Boolean(key),
      packs: Object.fromEntries(PACKAGE_SIZES.map(({ value, beads }) => [
        value,
        Math.ceil((item.count * BEAD_WEIGHT_G) / (beads * BEAD_WEIGHT_G)) || 1,
      ])),
    } as PurchaseRow;
  }), [selectedColorSystem, stats, totalBeadCount]);

  const groupedRows = useMemo(() => {
    if (scope === 'current') {
      return [{ system: selectedColorSystem, rows: currentRows }];
    }

    return colorSystemOptions.map(({ key, name }) => ({
      system: name as ColorSystem,
      rows: stats.map(item => {
        const colorKey = colorSystemMapping[item.hex as keyof typeof colorSystemMapping]?.[name as ColorSystem] || '';
        return {
          hex: item.hex,
          count: item.count,
          percentage: totalBeadCount ? item.count / totalBeadCount : 0,
          key: colorKey,
          mapped: Boolean(colorKey),
          packs: Object.fromEntries(PACKAGE_SIZES.map(({ value, beads }) => [
            value,
            Math.ceil((item.count * BEAD_WEIGHT_G) / (beads * BEAD_WEIGHT_G)) || 1,
          ])),
        } as PurchaseRow;
      }),
    }));
  }, [currentRows, scope, selectedColorSystem, stats, totalBeadCount]);

  const buildText = () => groupedRows
    .map(({ system, rows }) => [
      `【${system}】`,
      ...rows.map(row => `${formatKey(row.key)} ${row.hex} × ${row.count}颗（${packageSize}g × ${row.packs[packageSize]}包，${Math.round(row.percentage * 100)}%）`),
    ].join('\n'))
    .join('\n\n');

  const buildCsv = () => {
    const header = ['品牌', '色号', '颜色HEX', '数量', '占比', `${packageSize}g包装数`].map(escapeCsvCell).join(',');
    const lines = groupedRows.flatMap(({ system, rows }) => rows.map(row => [
      system,
      formatKey(row.key),
      row.hex,
      row.count,
      `${Math.round(row.percentage * 100)}%`,
      row.packs[packageSize],
    ].map(escapeCsvCell).join(',')));
    return [`\uFEFF${header}`, ...lines].join('\n');
  };

  const downloadCsv = () => {
    const blob = new Blob([buildCsv()], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/[\\/:*?"<>|]/g, '_') || '拼豆购买清单'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onToast('购买清单 CSV 已导出。', 'success');
  };

  const copyList = async () => {
    try {
      await navigator.clipboard.writeText(buildText());
      onToast('购买清单已复制。', 'success');
    } catch {
      onToast('复制失败，请手动选择文本。', 'error');
    }
  };

  if (totalBeadCount === 0) {
    return (
      <div className="fixed inset-0 z-[1700] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center">
          <p className="text-base font-black text-slate-900">画布上还没有拼豆</p>
          <p className="mt-1 text-sm text-slate-500">先画一点内容，再来生成购买清单。</p>
          <button onClick={onClose} className="mt-5 w-full rounded-2xl bg-slate-100 py-3 text-sm font-black text-slate-700">
            知道了
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1700] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-slate-50 shadow-2xl sm:max-h-[88vh] sm:rounded-3xl">
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-black text-slate-900">购买清单</h2>
              <p className="mt-0.5 truncate text-xs font-bold text-slate-500">
                {projectName} · {totalBeadCount.toLocaleString()} 颗 · {stats.length} 色
              </p>
            </div>
            <button onClick={onClose} className="shrink-0 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setScope('current')}
                className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-black transition-all ${scope === 'current' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                当前品牌
              </button>
              <button
                onClick={() => setScope('all')}
                className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-black transition-all ${scope === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                全部品牌
              </button>
            </div>
            <select
              value={packageSize}
              onChange={event => setPackageSize(event.target.value as PackageSize)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-600 outline-none focus:border-indigo-400"
            >
              {PACKAGE_SIZES.map(size => (
                <option key={size.value} value={size.value}>{size.label} / 约 {size.beads.toLocaleString()} 颗</option>
              ))}
            </select>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="space-y-4">
            {groupedRows.map(group => (
              <section key={group.system} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-3 py-2.5">
                  <h3 className="text-sm font-black text-slate-800">{group.system}</h3>
                  <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black text-slate-500">
                    {group.rows.filter(row => row.mapped).length}/{group.rows.length} 已映射
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {group.rows.map(row => (
                    <div key={`${row.hex}-${row.key}-${group.system}`} className="flex items-center gap-3 px-3 py-2.5">
                      <div
                        className="h-9 w-9 shrink-0 rounded-full border border-slate-100 shadow-inner"
                        style={{ backgroundColor: row.hex }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 truncate font-mono text-xs font-black text-slate-800">{formatKey(row.key)}</p>
                          {!row.mapped && (
                            <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-black text-amber-700">待映射</span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[10px] font-bold uppercase text-slate-400">
                          {row.hex} · {Math.round(row.percentage * 100)}%
                        </p>
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(2, row.percentage * 100)}%` }} />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black text-slate-900">{row.count.toLocaleString()} 颗</p>
                        <p className="mt-0.5 text-[10px] font-black text-indigo-600">{packageSize}g × {row.packs[packageSize]}包</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="flex gap-2">
            <button
              onClick={copyList}
              className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-black text-slate-700 transition-all active:scale-95 hover:bg-slate-200"
            >
              复制清单
            </button>
            <button
              onClick={downloadCsv}
              className="flex-1 rounded-2xl bg-indigo-600 py-3 text-sm font-black text-white transition-all active:scale-95 hover:bg-indigo-700"
            >
              导出 CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
