import React, { useState, useEffect } from 'react';

const AICHO_APP_ID = '6757690606';
const AICHO_ICON_FALLBACK = 'https://aicho.chat/apple-touch-icon.png';

const promoLinks = [
  {
    id: 'aicho-journal',
    title: 'Aicho Journal',
    subtitle: 'AI 情绪日记 · iOS App',
    url: 'https://apps.apple.com/us/app/aicho-journal/id6757690606',
    icon: '',
    fallbackIcon: AICHO_ICON_FALLBACK,
    type: 'app' as const,
  },
  {
    id: 'aicho-brand',
    title: 'Aicho 日记',
    subtitle: '在线情绪日记',
    url: 'https://aicho.chat/brand',
    icon: 'https://aicho.chat/apple-touch-icon.png',
    type: 'web' as const,
  },
  {
    id: 'time-countdown',
    title: '屏幕倒计时',
    subtitle: '让同事知道你去哪了',
    url: 'https://time.danzaii.cn',
    icon: 'https://time.danzaii.cn/favicon.ico',
    type: 'web' as const,
  },
  {
    id: 'github',
    title: 'PixelBead',
    subtitle: '开源项目 · GitHub',
    url: 'https://github.com/DanZai233/PixelBead',
    icon: '',
    type: 'github' as const,
  },
];

const GitHubIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

export const PromoSection: React.FC = () => {
  const [appIconUrl, setAppIconUrl] = useState<string>(AICHO_ICON_FALLBACK);

  useEffect(() => {
    fetch(`https://itunes.apple.com/lookup?id=${AICHO_APP_ID}`)
      .then((res) => res.json())
      .then((data) => {
        const icon = data?.results?.[0]?.artworkUrl512 || data?.results?.[0]?.artworkUrl100;
        if (icon) setAppIconUrl(icon.replace('100x100', '512x512').replace('100x100bb', '512x512'));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mt-6 pt-4 border-t border-slate-100">
      <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
        <span>更多作品</span>
      </div>
      <div className="space-y-2">
        {promoLinks.map((item) => {
          const iconSrc = item.type === 'app' ? appIconUrl : item.type === 'github' ? null : item.icon;
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 hover:bg-white hover:shadow-md border border-slate-100 hover:border-indigo-100 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100">
                {item.type === 'github' ? (
                  <span className="text-slate-600 group-hover:text-slate-900">
                    <GitHubIcon />
                  </span>
                ) : iconSrc ? (
                  <img
                    src={iconSrc}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (item.type === 'app') {
                        (e.target as HTMLImageElement).src = item.fallbackIcon || AICHO_ICON_FALLBACK;
                      }
                    }}
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 truncate">
                  {item.title}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{item.subtitle}</div>
              </div>
              <svg
                className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          );
        })}
      </div>
    </div>
  );
};
