'use client';

import { useState } from 'react';
import { useI18n } from '../../lib/i18n-context';

interface Props { onClose: () => void; }

type StepKey = 'step1' | 'step2' | 'step3' | 'step4' | 'step5';

export function TelegramHelpModal({ onClose }: Props) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  function copyCommand() {
    void navigator.clipboard.writeText('/start');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const steps: { key: StepKey; titleKey: keyof typeof t.telegram; descKey: keyof typeof t.telegram; highlight?: boolean }[] = [
    { key: 'step1', titleKey: 'step1Title', descKey: 'step1Desc' },
    { key: 'step2', titleKey: 'step2Title', descKey: 'step2Desc', highlight: true },
    { key: 'step3', titleKey: 'step3Title', descKey: 'step3Desc' },
    { key: 'step4', titleKey: 'step4Title', descKey: 'step4Desc' },
    { key: 'step5', titleKey: 'step5Title', descKey: 'step5Desc' },
  ];

  const stepIcons = [
    // 01 - phone/tablet
    <svg key="s1" width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="M8 4v2M16 4v2M2 10h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    // 02 - search
    <svg key="s2" width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    // 03 - send
    <svg key="s3" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M20 12l-6-6M20 12l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    // 04 - copy
    <svg key="s4" width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    // 05 - check
    <svg key="s5" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5 11-11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ];

  const nums = ['01', '02', '03', '04', '05'];
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'AiLabChecklistBot';

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6
                 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg card p-0 overflow-hidden shadow-2xl
                      animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500/10 to-blue-500/10
                        border-b border-sky-200 dark:border-sky-400/20 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#229ED9]/15 border border-[#229ED9]/30
                              flex items-center justify-center shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#229ED9">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.02 9.52c-.149.658-.538.818-1.09.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.889.701z"/>
                </svg>
              </div>
              <div>
                <h3 className="headline text-xl text-slate-900 dark:text-white">
                  {t.telegram.modalTitle}
                </h3>
                <p className="font-mono text-[10px] text-slate-400">{t.telegram.modalSubtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors
                         w-8 h-8 flex items-center justify-center rounded-lg
                         hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="px-6 py-5 space-y-3">
          {steps.map(({ key, titleKey, descKey, highlight }, idx) => (
            <div
              key={key}
              className={`flex items-start gap-4 p-3.5 rounded-xl transition-colors
                ${highlight
                  ? 'bg-sky-50 dark:bg-sky-400/10 border border-sky-200 dark:border-sky-400/20'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                ${highlight
                  ? 'bg-sky-100 dark:bg-sky-400/20 text-sky-600 dark:text-sky-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                {stepIcons[idx]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                  <span className="text-slate-400 dark:text-slate-500 mr-1.5">{nums[idx]}</span>
                  {t.telegram[titleKey] as string}
                </p>
                <p className="font-mono text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                  {t.telegram[descKey] as string}
                </p>
                {/* Step 2: show bot username */}
                {idx === 1 && (
                  <p className="font-mono text-[10px] text-sky-600 dark:text-sky-400 mt-1 font-semibold">
                    {t.telegram.step2BotLabel} @{botUsername}
                  </p>
                )}
                {/* Step 3: copy /start button */}
                {idx === 2 && (
                  <button
                    onClick={copyCommand}
                    className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px]
                               bg-slate-800 dark:bg-slate-700 text-slate-200 px-2.5 py-1
                               rounded-md hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                  >
                    <code>/start</code>
                    {copied
                      ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 6l3 3 7-7" stroke="#34d399" strokeWidth="1.4" strokeLinecap="round"/></svg>
                      : <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M3 8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.2"/></svg>
                    }
                    {copied ? t.common.copied : t.common.copyCommand}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bot message preview */}
        <div className="mx-6 mb-5 p-4 rounded-xl bg-[#17212B] border border-slate-700">
          <p className="font-mono text-[9px] text-slate-500 mb-2 uppercase tracking-wider">
            {t.telegram.previewTitle}
          </p>
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-[#229ED9] flex items-center justify-center shrink-0 text-white text-xs font-bold">
              A
            </div>
            <div className="bg-[#182533] rounded-lg rounded-tl-none px-3 py-2 max-w-[80%]">
              <p className="text-white text-[11px] font-mono leading-relaxed">
                👋 {t.telegram.previewGreeting}<br/>
                {t.telegram.previewChatIdLabel}<br/>
                <code className="bg-[#1C2D3E] px-1.5 py-0.5 rounded text-sky-300">123456789</code><br/>
                <span className="text-slate-400 text-[9px]">{t.telegram.previewHint}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button onClick={onClose} className="btn-primary w-full flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t.telegram.confirmBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
