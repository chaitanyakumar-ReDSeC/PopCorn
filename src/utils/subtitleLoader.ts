/**
 * Subtitle Loader & Parser Utility for Static & Dynamic Deployments (e.g. GitHub Pages)
 * 
 * Handles CORS restrictions on external hosts (such as archive.org) by utilizing
 * a cascading fallback of public CORS proxies, converts SRT format to WebVTT on the fly,
 * and produces safe same-origin Blob Object URLs (URL.createObjectURL) to assign to <track> elements.
 */

export interface SubCue {
  start: number;
  end: number;
  text: string;
}

/**
 * Validates if the fetched string looks like valid subtitle content (WebVTT or SRT),
 * and is not an HTML error page (e.g., 404/Cloudflare/CORS proxy error) or JSON error.
 */
export function isValidSubtitleText(text: string | null | undefined): boolean {
  if (!text || typeof text !== 'string') return false;

  const clean = text.replace(/^\uFEFF/, '').trim();
  if (clean.length < 5) return false;

  // Reject HTML error pages from proxies or static 404s
  const lower = clean.toLowerCase();
  if (
    lower.startsWith('<!doctype') ||
    lower.startsWith('<html') ||
    lower.includes('<body') ||
    lower.includes('error code: 522') ||
    lower.startsWith('{"error"') ||
    lower.startsWith('{"success":false') ||
    lower.startsWith('{"status":')
  ) {
    return false;
  }

  // Must have WEBVTT header or standard subtitle cue indicators (e.g. "-->")
  const hasWebVtt = clean.startsWith('WEBVTT');
  const hasArrow = clean.includes('-->');
  const hasSrtTimestamps = /\d{1,2}:\d{2}:\d{2}[.,]\d{1,3}/.test(clean);

  return hasWebVtt || hasArrow || hasSrtTimestamps;
}

/**
 * Parses timestamp string into floating seconds
 */
export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim();

  // 00:00:00.000 or 00:00:00,000
  const matchHms = cleaned.match(/^(\d+):(\d{2}):(\d{2})(?:[.,](\d+))?/);
  if (matchHms) {
    const h = parseInt(matchHms[1], 10);
    const m = parseInt(matchHms[2], 10);
    const s = parseInt(matchHms[3], 10);
    const msStr = matchHms[4] || '0';
    const ms = parseInt(msStr.padEnd(3, '0').substring(0, 3), 10);
    return h * 3600 + m * 60 + s + ms / 1000;
  }

  // 00:00.000 or 00:00,000
  const matchMs = cleaned.match(/^(\d{2}):(\d{2})(?:[.,](\d+))?/);
  if (matchMs) {
    const m = parseInt(matchMs[1], 10);
    const s = parseInt(matchMs[2], 10);
    const msStr = matchMs[3] || '0';
    const ms = parseInt(msStr.padEnd(3, '0').substring(0, 3), 10);
    return m * 60 + s + ms / 1000;
  }

  return 0;
}

/**
 * Formats seconds into WebVTT timestamp 00:00:00.000
 */
export function formatVttTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Converts any raw subtitle text (SRT or raw WebVTT) into standard, compliant WebVTT format.
 */
export function convertSrtToWebVtt(rawText: string): string {
  if (!rawText) return 'WEBVTT\n\n';

  // 1. Remove UTF-8 BOM and normalize newlines
  let content = rawText
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  // If already pure WebVTT, ensure commas in timecodes are converted to dots
  if (content.startsWith('WEBVTT')) {
    // Replace commas in timestamps like 00:01:23,456 --> 00:01:25,789
    return content.replace(
      /(\d{1,2}:\d{2}:\d{2}),(\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}),(\d{1,3})/g,
      (_match, t1, ms1, t2, ms2) => {
        return `${t1}.${ms1.padEnd(3, '0').slice(0, 3)} --> ${t2}.${ms2.padEnd(3, '0').slice(0, 3)}`;
      }
    );
  }

  // 2. Parse SRT blocks and transform into WebVTT
  const blocks = content.split(/\n\s*\n/);
  const vttLines: string[] = ['WEBVTT', ''];

  let cueIndex = 1;
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let timeLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        timeLineIdx = i;
        break;
      }
    }

    if (timeLineIdx === -1) continue;

    const timeLine = lines[timeLineIdx];
    const parts = timeLine.split('-->');
    if (parts.length < 2) continue;

    const startSec = parseTimeToSeconds(parts[0]);
    const endSec = parseTimeToSeconds(parts[1]);

    if (endSec <= startSec) continue;

    const textLines = lines.slice(timeLineIdx + 1);
    if (textLines.length === 0) continue;

    const cueText = textLines.join('\n').trim();
    if (!cueText) continue;

    vttLines.push(String(cueIndex));
    vttLines.push(`${formatVttTime(startSec)} --> ${formatVttTime(endSec)}`);
    vttLines.push(cueText);
    vttLines.push('');
    cueIndex++;
  }

  return vttLines.join('\n');
}

/**
 * Creates a same-origin Blob Object URL for a WebVTT string.
 * This completely avoids cross-origin security/tainted issues on <track> elements.
 */
export function createVttBlobUrl(vttContent: string): string {
  const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
  return URL.createObjectURL(blob);
}

/**
 * Safely revokes an existing Blob Object URL to prevent memory leaks.
 */
export function revokeVttBlobUrl(url: string | null | undefined): void {
  if (url && typeof url === 'string' && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore revocation errors
    }
  }
}

/**
 * Fetches an external subtitle URL through a cascading series of CORS proxies
 * with fallback timeouts and content validation.
 */
export async function fetchSubtitleTextWithFallback(
  url: string,
  timeoutMs = 5000
): Promise<string | null> {
  if (!url) return null;

  const trimmedUrl = url.trim();

  // 1. If it is already a local blob: or data: URL, read directly
  if (trimmedUrl.startsWith('blob:') || trimmedUrl.startsWith('data:')) {
    try {
      const res = await fetch(trimmedUrl);
      if (res.ok) {
        const txt = await res.text();
        if (isValidSubtitleText(txt)) return txt;
      }
    } catch (e) {
      console.warn('Failed to read local subtitle blob/data URL:', e);
    }
    return null;
  }

  // 2. Check if same-origin (e.g. relative URL on same host)
  const isSameOrigin =
    trimmedUrl.startsWith('/') ||
    (typeof window !== 'undefined' && trimmedUrl.startsWith(window.location.origin));

  if (isSameOrigin) {
    try {
      const res = await fetch(trimmedUrl);
      if (res.ok) {
        const txt = await res.text();
        if (isValidSubtitleText(txt)) return txt;
      }
    } catch (e) {
      console.warn('Same-origin subtitle fetch failed:', e);
    }
  }

  // 3. Define the proxy & direct attempt cascade
  type Fetcher = () => Promise<string | null>;

  const attempts: { name: string; fn: Fetcher }[] = [];

  // Attempt A: Local backend proxy (works in Node/Express dev & full-stack container)
  if (typeof window !== 'undefined' && !window.location.hostname.includes('github.io')) {
    attempts.push({
      name: 'local-api-proxy',
      fn: async () => {
        const res = await fetchWithTimeout(
          `/api/subtitles?url=${encodeURIComponent(trimmedUrl)}`,
          timeoutMs
        );
        if (res.ok) {
          const txt = await res.text();
          if (isValidSubtitleText(txt)) return txt;
        }
        return null;
      },
    });
  }

  // Attempt B: Direct fetch (in case upstream has Access-Control-Allow-Origin: *)
  attempts.push({
    name: 'direct-fetch',
    fn: async () => {
      const res = await fetchWithTimeout(trimmedUrl, Math.min(timeoutMs, 3000));
      if (res.ok) {
        const txt = await res.text();
        if (isValidSubtitleText(txt)) return txt;
      }
      return null;
    },
  });

  // Attempt C: corsproxy.io (public CORS proxy recommended for GitHub Pages)
  attempts.push({
    name: 'corsproxy-io',
    fn: async () => {
      const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(trimmedUrl)}`;
      const res = await fetchWithTimeout(proxyUrl, timeoutMs);
      if (res.ok) {
        const txt = await res.text();
        if (isValidSubtitleText(txt)) return txt;
      }
      return null;
    },
  });

  // Attempt D: allorigins.win (raw mode)
  attempts.push({
    name: 'allorigins-raw',
    fn: async () => {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(trimmedUrl)}`;
      const res = await fetchWithTimeout(proxyUrl, timeoutMs);
      if (res.ok) {
        const txt = await res.text();
        if (isValidSubtitleText(txt)) return txt;
      }
      return null;
    },
  });

  // Attempt E: allorigins.win (JSON mode - handles origins that drop raw text headers)
  attempts.push({
    name: 'allorigins-json',
    fn: async () => {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(trimmedUrl)}`;
      const res = await fetchWithTimeout(proxyUrl, timeoutMs);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.contents === 'string' && isValidSubtitleText(data.contents)) {
          return data.contents;
        }
      }
      return null;
    },
  });

  // Attempt F: codetabs proxy
  attempts.push({
    name: 'codetabs-proxy',
    fn: async () => {
      const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(trimmedUrl)}`;
      const res = await fetchWithTimeout(proxyUrl, timeoutMs);
      if (res.ok) {
        const txt = await res.text();
        if (isValidSubtitleText(txt)) return txt;
      }
      return null;
    },
  });

  // Execute attempts in sequence until a valid subtitle is found
  for (const attempt of attempts) {
    try {
      const result = await attempt.fn();
      if (result) {
        return result;
      }
    } catch {
      // Silently fall through to the next proxy option
    }
  }

  console.warn(`[SubtitleLoader] All CORS proxies and direct fetches failed for: ${trimmedUrl}`);
  return null;
}

/**
 * High-level helper: Fetches subtitle through CORS proxy if needed,
 * converts to WebVTT, creates an inline Blob URL, and returns it safely.
 *
 * @returns {Promise<{ blobUrl: string | null; error?: string }>}
 */
export async function loadSubtitleAsBlobUrl(
  url: string,
  timeoutMs = 5000
): Promise<{ blobUrl: string | null; error?: string }> {
  if (!url) {
    return { blobUrl: null };
  }

  try {
    const rawText = await fetchSubtitleTextWithFallback(url, timeoutMs);
    if (!rawText) {
      return {
        blobUrl: null,
        error: 'Subtitle file could not be loaded via direct or CORS proxy fetch.',
      };
    }

    const vttContent = convertSrtToWebVtt(rawText);
    const blobUrl = createVttBlobUrl(vttContent);
    return { blobUrl };
  } catch (err: any) {
    const msg = err?.message || 'Unknown error loading subtitles';
    console.warn('[SubtitleLoader] Error loading subtitle as blob URL:', msg);
    return { blobUrl: null, error: msg };
  }
}

/**
 * Helper to fetch with an AbortSignal timeout
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}
