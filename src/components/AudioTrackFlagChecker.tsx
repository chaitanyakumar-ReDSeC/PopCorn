import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Check,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

const FLAG_URL = 'chrome://flags/#enable-experimental-web-platform-features';

export const AudioTrackFlagChecker: React.FC = () => {
  const [isBrowserFlagActive, setIsBrowserFlagActive] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Check if browser currently exposes native HTMLMediaElement.audioTracks
  const checkSupport = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const video = document.createElement('video');
      const supported = 'audioTracks' in video && (video as any).audioTracks !== undefined;
      return supported;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    setIsBrowserFlagActive(checkSupport());
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch (err) {
      console.warn('Clipboard copy error:', err);
      return false;
    }
  };

  const handleGoToFlag = async () => {
    await copyToClipboard(FLAG_URL);
    setShowGuide(true);
    setToastMessage(
      'Flag link copied to clipboard! Chrome security prevents web apps from directly loading internal chrome:// pages. Open a new tab (Ctrl+T / Cmd+T), paste into your address bar, and press Enter to enable.'
    );

    // Attempt direct navigation in a new tab (Chromium restricts chrome:// navigation from web contexts, but calling window.open handles browsers/extensions that permit it)
    try {
      window.open(FLAG_URL, '_blank');
    } catch {
      // Expected browser security handling
    }
  };

  // IF ACTIVE / ENABLED: Only show the flag title and "Enabled" with green check, nothing more.
  if (isBrowserFlagActive) {
    return (
      <div className="bg-neutral-900/90 border border-emerald-500/30 rounded-2xl px-4 py-3 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Volume2 className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-white tracking-wide">
            Multiple Audio Tracks Flag
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
          <span>Enabled</span>
        </span>
      </div>
    );
  }

  // IF DISABLED: Show status as Disabled, brief explanation, and the Enable button
  return (
    <div className="relative bg-gradient-to-r from-neutral-900/95 via-neutral-950/95 to-neutral-900/95 border border-red-500/25 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 bg-red-950/90 border border-red-500/40 text-neutral-100 rounded-xl p-3 text-xs flex items-start justify-between gap-2 shadow-lg">
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-snug text-neutral-200">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-neutral-400 hover:text-white p-0.5 shrink-0 cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Bar: Icon, Title & Disabled Badge */}
      <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Multiple Audio Tracks Flag
              </h4>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Disabled
              </span>
            </div>
            {/* Non-Technical 2-Sentence Explanation */}
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
              Private Screen needs this browser feature to play and switch between different audio languages (like English or regional audio) in your video files. Without it enabled, your browser will only play one default audio track.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Check Prompt & Enable Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-white/5">
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          Please have a quick check: click <strong className="text-neutral-200">Enable</strong> to copy the link and turn it on in your browser.
        </p>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleGoToFlag}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-lg cursor-pointer"
          >
            <span>Enable</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Guide Card (Opens on clicking Enable) */}
      {showGuide && (
        <div className="p-3 bg-black/60 border border-white/10 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-neutral-200 font-semibold text-[11px]">
            <span className="flex items-center space-x-1.5 text-red-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>How to enable in 10 seconds:</span>
            </span>
            <button
              onClick={() => setShowGuide(false)}
              className="text-[10px] text-neutral-400 hover:text-white cursor-pointer underline"
            >
              Close
            </button>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-neutral-300 text-[11px] leading-relaxed">
            <li>
              Press <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-white/10 rounded text-[10px] text-white">Ctrl+T</kbd> (or <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-white/10 rounded text-[10px] text-white">Cmd+T</kbd>) to open a new tab.
            </li>
            <li>
              Paste the copied link (<code className="text-red-400 font-mono text-[10px] bg-neutral-900 px-1 py-0.5 rounded select-all">{FLAG_URL}</code>) into the address bar and press <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-white/10 rounded text-[10px] text-white">Enter</kbd>.
            </li>
            <li>
              Set <strong>Experimental Web Platform features</strong> to <span className="text-emerald-400 font-bold">Enabled</span>, then click <strong>Relaunch</strong>.
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};
