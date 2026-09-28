import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = '🎨', title, description, actionLabel, onAction }) => {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">{icon}</div>
      <h3 className="text-sm font-black text-slate-800 sm:text-base">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white transition-all active:scale-95 hover:bg-indigo-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
