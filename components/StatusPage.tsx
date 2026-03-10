import React, { useState, useEffect } from 'react';
import { getAnalytics } from '../services/analyticsService';

interface AnalyticsData {
  total: number;
  daily: Record<string, any>;
}

export const StatusPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    const result = await getAnalytics();
    setData(result);
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getTodayVisits = () => {
    if (!data?.daily) return 0;
    const today = getTodayDate();
    return data.daily[today]?.visits || 0;
  };

  const getLast7DaysData = () => {
    if (!data?.daily) return [];

    const days: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        formattedDate: formatDate(dateStr),
        visits: data.daily[dateStr]?.visits || 0,
        mobile: data.daily[dateStr]?.['device:mobile'] || 0,
        desktop: data.daily[dateStr]?.['device:desktop'] || 0,
      });
    }
    return days;
  };

  const maxVisitsInLast7Days = () => {
    const days = getLast7DaysData();
    return Math.max(...days.map(d => d.visits));
  };

  const totalDeviceStats = () => {
    const days = getLast7DaysData();
    const totalMobile = days.reduce((acc, d) => acc + d.mobile, 0);
    const totalDesktop = days.reduce((acc, d) => acc + d.desktop, 0);
    return { mobile: totalMobile, desktop: totalDesktop };
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white p-4 md:p-6 border-b border-slate-200 flex items-center justify-between z-10">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 italic flex items-center gap-2">
            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            网站统计
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAnalytics}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all"
              title="刷新"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : data ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 md:p-6 text-white">
                  <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">总访问量</div>
                  <div className="text-3xl md:text-4xl font-black">{data.total.toLocaleString()}</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 md:p-6 text-white">
                  <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">今日访问</div>
                  <div className="text-3xl md:text-4xl font-black">{getTodayVisits().toLocaleString()}</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-4 md:p-6 text-white">
                  <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">近7天</div>
                  <div className="text-3xl md:text-4xl font-black">
                    {getLast7DaysData().reduce((acc, d) => acc + d.visits, 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <section>
                <h3 className="text-lg font-black text-slate-900 mb-4">近7天趋势</h3>
                <div className="bg-slate-50 rounded-2xl p-4 md:p-6">
                  <div className="flex items-end justify-between gap-2 h-32">
                    {getLast7DaysData().map((day) => {
                      const heightPercent = maxVisitsInLast7Days() > 0
                        ? (day.visits / maxVisitsInLast7Days()) * 100
                        : 0;
                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                          <div
                            className="w-full bg-indigo-500 rounded-t-lg transition-all hover:bg-indigo-600 relative group"
                            style={{ height: `${Math.max(heightPercent, 4)}%` }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {day.visits}
                            </div>
                          </div>
                          <div className="text-[10px] md:text-xs text-slate-600 font-medium">
                            {day.formattedDate}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-black text-slate-900 mb-4">设备分布（近7天）</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4 md:p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-slate-900">
                          {totalDeviceStats().mobile.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">移动端</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 md:p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-slate-900">
                          {totalDeviceStats().desktop.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">桌面端</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-black text-slate-900 mb-4">每日详情</h3>
                <div className="space-y-2">
                  {getLast7DaysData().slice().reverse().map((day) => (
                    <div key={day.date} className="bg-slate-50 rounded-xl p-3 md:p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-black text-indigo-600">{day.formattedDate}</span>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{day.visits} 次访问</div>
                          <div className="text-xs text-slate-500">
                            移动端 {day.mobile} · 桌面端 {day.desktop}
                          </div>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-slate-400 font-medium">暂无统计数据</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
