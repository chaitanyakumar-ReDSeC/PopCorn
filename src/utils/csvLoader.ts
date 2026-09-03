import { MediaItem, AudioTrack, SubtitleTrack, Episode } from '../types';

export function formatImageUrl(url: string): string {
  if (!url) return '';
  let cleanUrl = url.trim().replace(/^["']|["']$/g, '');
  // Convert GitHub blob image URLs to raw URLs for direct browser img rendering
  if (cleanUrl.includes('github.com') && cleanUrl.includes('/blob/')) {
    cleanUrl = cleanUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
  }
  return cleanUrl;
}

export function parseCSVLine(line: string): string[] {
  let trimmed = line.trim();
  // Strip outer parenthesis if record is wrapped in ( ... )
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    trimmed = trimmed.substring(1, trimmed.length - 1).trim();
  }

  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    const nextChar = trimmed[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function isAudioUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.toLowerCase().split('?')[0];
  return (
    clean.endsWith('.mp3') ||
    clean.endsWith('.aac') ||
    clean.endsWith('.m4a') ||
    clean.endsWith('.wav') ||
    clean.endsWith('.ac3') ||
    clean.endsWith('.eac3') ||
    clean.endsWith('.ogg') ||
    clean.endsWith('.flac')
  );
}

function buildAudioTrack(
  id: string,
  language: string,
  label: string,
  url: string,
  isOriginal: boolean = false
): AudioTrack {
  const isAudio = isAudioUrl(url);
  return {
    id,
    language,
    label,
    isOriginal,
    isDefault: isOriginal,
    ...(isAudio ? { src: url } : { videoUrl: url }),
  };
}

export function parseMoviesCSV(csvText: string): MediaItem[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const items: MediaItem[] = [];

  const firstRow = parseCSVLine(lines[0]);
  const firstRowLower = firstRow.map((c) => c.toLowerCase().trim());
  const isHeader = firstRowLower.some(
    (col) =>
      col.includes('title') ||
      col.includes('year') ||
      col.includes('video') ||
      col.includes('subtitle') ||
      col.includes('audio') ||
      col.includes('original') ||
      col.includes('telugu')
  );

  // Check header indices if header exists
  let titleIdx = 0;
  let yearIdx = 1;
  let posterIdx = 2;
  let videoIdx = 3;
  let subtitleIdx = 4;
  let origAudioIdx = -1;
  let telIdx = -1;
  let hinIdx = -1;
  let engIdx = -1;
  let tamIdx = -1;
  let othIdx = -1;

  if (isHeader) {
    firstRowLower.forEach((col, idx) => {
      if (col === 'title') titleIdx = idx;
      else if (col === 'year') yearIdx = idx;
      else if (col === 'poster') posterIdx = idx;
      else if (col === 'video') videoIdx = idx;
      else if (col === 'subtitle') subtitleIdx = idx;
      else if (col === 'original_audio' || col === 'default_audio' || col === 'original' || col === 'orig_audio') origAudioIdx = idx;
      else if (col === 'audio_tel' || col === 'telugu' || col === 'tel') telIdx = idx;
      else if (col === 'audio_hin' || col === 'hindi' || col === 'hin') hinIdx = idx;
      else if (col === 'audio_eng' || col === 'english' || col === 'eng') engIdx = idx;
      else if (col === 'audio_tam' || col === 'tamil' || col === 'tam') tamIdx = idx;
      else if (col === 'audio_other' || col === 'audio_oth' || col === 'other' || col === 'oth') othIdx = idx;
    });
  }

  const startIdx = isHeader ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length === 0 || !cols[0]) continue;

    const title = (cols[titleIdx] || cols[0] || 'Untitled Movie').replace(/^["']|["']$/g, '').trim();
    const year = parseInt(cols[yearIdx] || cols[1], 10) || 2026;
    const rawPoster = cols[posterIdx] || cols[2] || '';
    const poster = formatImageUrl(rawPoster);

    let videoUrl = '';
    let subtitleUrl = '';
    let origAudioName = '';
    let tel = '';
    let hin = '';
    let eng = '';
    let tam = '';
    let oth = '';

    if (isHeader && (origAudioIdx !== -1 || telIdx !== -1 || videoIdx !== -1)) {
      videoUrl = (cols[videoIdx] || '').replace(/^["']|["']$/g, '').trim();
      subtitleUrl = (cols[subtitleIdx] || '').replace(/^["']|["']$/g, '').trim();
      origAudioName = origAudioIdx !== -1 ? (cols[origAudioIdx] || '').replace(/^["']|["']$/g, '').trim() : '';
      tel = telIdx !== -1 ? (cols[telIdx] || '').replace(/^["']|["']$/g, '').trim() : '';
      hin = hinIdx !== -1 ? (cols[hinIdx] || '').replace(/^["']|["']$/g, '').trim() : '';
      eng = engIdx !== -1 ? (cols[engIdx] || '').replace(/^["']|["']$/g, '').trim() : '';
      tam = tamIdx !== -1 ? (cols[tamIdx] || '').replace(/^["']|["']$/g, '').trim() : '';
      oth = othIdx !== -1 ? (cols[othIdx] || '').replace(/^["']|["']$/g, '').trim() : '';
    } else if (cols.length >= 11) {
      // 11-column format: title,year,poster,video,subtitle,original_audio,audio_tel,audio_hin,audio_eng,audio_tam,audio_other
      videoUrl = (cols[3] || '').replace(/^["']|["']$/g, '').trim();
      subtitleUrl = (cols[4] || '').replace(/^["']|["']$/g, '').trim();
      origAudioName = (cols[5] || '').replace(/^["']|["']$/g, '').trim();
      tel = (cols[6] || '').replace(/^["']|["']$/g, '').trim();
      hin = (cols[7] || '').replace(/^["']|["']$/g, '').trim();
      eng = (cols[8] || '').replace(/^["']|["']$/g, '').trim();
      tam = (cols[9] || '').replace(/^["']|["']$/g, '').trim();
      oth = (cols[10] || '').replace(/^["']|["']$/g, '').trim();
    } else if (cols.length >= 9) {
      // 10-column format: title,year,poster,video,subtitle,audio_tel,audio_hin,audio_eng,audio_tam,audio_other
      videoUrl = (cols[3] || '').replace(/^["']|["']$/g, '').trim();
      subtitleUrl = (cols[4] || '').replace(/^["']|["']$/g, '').trim();
      tel = (cols[5] || '').replace(/^["']|["']$/g, '').trim();
      hin = (cols[6] || '').replace(/^["']|["']$/g, '').trim();
      eng = (cols[7] || '').replace(/^["']|["']$/g, '').trim();
      tam = (cols[8] || '').replace(/^["']|["']$/g, '').trim();
      oth = (cols[9] || '').replace(/^["']|["']$/g, '').trim();
    } else {
      // 8-column format: title,year,poster,telugu,english,hindi,tamil,original
      tel = (cols[3] || '').replace(/^["']|["']$/g, '').trim();
      eng = (cols[4] || '').replace(/^["']|["']$/g, '').trim();
      hin = (cols[5] || '').replace(/^["']|["']$/g, '').trim();
      tam = (cols[6] || '').replace(/^["']|["']$/g, '').trim();
      const orig = (cols[7] || '').replace(/^["']|["']$/g, '').trim();
      videoUrl = tel || eng || hin || tam || orig || '';
      origAudioName = orig ? 'Original' : '';
    }

    const audioTracks: AudioTrack[] = [];
    const subtitleTracks: SubtitleTrack[] = [];

    // 1. Add Original/Default Embedded Audio Track
    const originalLanguage = origAudioName || 'Original';
    if (videoUrl) {
      audioTracks.push({
        id: 'orig',
        language: originalLanguage,
        label: `${originalLanguage} Audio`,
        channels: 'Embedded 5.1/Stereo',
        codec: 'AAC/AC3',
        videoUrl: videoUrl,
        isOriginal: true,
        isDefault: true,
      });
    }

    // 2. Add extra audio track streams if specified
    if (tel) audioTracks.push(buildAudioTrack('tel', 'Telugu', 'Telugu Audio', tel));
    if (hin) audioTracks.push(buildAudioTrack('hin', 'Hindi', 'Hindi Audio', hin));
    if (eng && (!origAudioName || origAudioName.toLowerCase() !== 'english' || eng !== videoUrl)) {
      audioTracks.push(buildAudioTrack('eng', 'English', 'English Audio', eng));
    }
    if (tam) audioTracks.push(buildAudioTrack('tam', 'Tamil', 'Tamil Audio', tam));
    if (oth) audioTracks.push(buildAudioTrack('oth', 'Other', 'Other Audio', oth));

    if (subtitleUrl) {
      const subList = subtitleUrl.includes(';')
        ? subtitleUrl.split(';')
        : [subtitleUrl];

      subList.forEach((rawSub, sIdx) => {
        const sub = rawSub.trim();
        if (!sub) return;

        let lang = 'English';
        const lower = sub.toLowerCase();
        if (lower.includes('hin')) lang = 'Hindi';
        else if (lower.includes('tel')) lang = 'Telugu';
        else if (lower.includes('tam')) lang = 'Tamil';
        else if (lower.includes('spa')) lang = 'Spanish';
        else if (lower.includes('fre') || lower.includes('fra')) lang = 'French';
        else if (lower.includes('ger') || lower.includes('deu')) lang = 'German';
        else if (lower.includes('eng')) lang = 'English';

        subtitleTracks.push({
          id: `sub-${sIdx}`,
          language: lang,
          label: `${lang} Subtitles`,
          src: sub,
          isDefault: sIdx === 0,
        });
      });
    }

    items.push({
      id: `movie-csv-${i}-${title.toLowerCase().replace(/\s+/g, '-')}`,
      title,
      type: 'movie',
      year,
      rating: 0,
      genres: [],
      description: `${title} (${year})`,
      poster: poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop',
      banner: poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop',
      videoUrl: videoUrl || audioTracks[0]?.videoUrl || '',
      audioTracks,
      subtitleTracks,
    });
  }

  return items;
}

export function parseSeriesCSV(csvText: string): MediaItem[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const items: MediaItem[] = [];

  const firstRow = parseCSVLine(lines[0]);
  const firstRowLower = firstRow.map((c) => c.toLowerCase().trim());

  // Check if first line is a header
  const isHeader = firstRowLower.some(
    (col) =>
      col.includes('title') ||
      col.includes('year') ||
      col.includes('poster') ||
      col.includes('season') ||
      col.includes('sepisode') ||
      col.includes('ep') ||
      /^s\d+e\d+/i.test(col)
  );

  let titleIdx = 0;
  let yearIdx = 1;
  let posterIdx = 2;
  let seasonsIdx = -1;
  let sepisodesIdx = -1;
  let subtitleIdx = -1;

  interface HeaderEpColMapping {
    season: number;
    episode: number;
    colIdx: number;
  }
  const headerEpMappings: HeaderEpColMapping[] = [];

  if (isHeader) {
    firstRowLower.forEach((col, idx) => {
      if (col === 'title') {
        titleIdx = idx;
      } else if (col === 'year') {
        yearIdx = idx;
      } else if (col === 'poster') {
        posterIdx = idx;
      } else if (
        col === 'seasons' ||
        col === 'season' ||
        col === 'total_seasons' ||
        col === 'seasons_count'
      ) {
        seasonsIdx = idx;
      } else if (
        col === 'sepisodes' ||
        col === 'sepisode' ||
        col === 'episodes_per_season' ||
        col === 'max_episodes' ||
        col === 'episodes'
      ) {
        sepisodesIdx = idx;
      } else if (col === 'subtitle' || col === 'subtitles' || col === 'sub') {
        subtitleIdx = idx;
      } else {
        // Matches s1e1, s01e02, s2_e3, season1_ep2
        const sMatch =
          col.match(/^s(\d+)[_e](\d+)$/i) ||
          col.match(/^s(\d+)e(\d+)$/i) ||
          col.match(/^season\s*(\d+)\s*ep(?:isode)?\s*(\d+)$/i);
        if (sMatch) {
          headerEpMappings.push({
            season: parseInt(sMatch[1], 10),
            episode: parseInt(sMatch[2], 10),
            colIdx: idx,
          });
        } else {
          // Legacy ep1, ep2 pattern (defaults to season 1)
          const epOnlyMatch = col.match(/^ep(?:isode)?\s*(\d+)$/i);
          if (epOnlyMatch) {
            headerEpMappings.push({
              season: 1,
              episode: parseInt(epOnlyMatch[1], 10),
              colIdx: idx,
            });
          }
        }
      }
    });
  }

  const startIdx = isHeader ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length === 0 || !cols[0]) continue;

    const title = (cols[titleIdx] || cols[0] || 'Untitled Series').replace(/^["']|["']$/g, '').trim();
    const year = parseInt(cols[yearIdx] || cols[1], 10) || 2026;
    const rawPoster = cols[posterIdx] || cols[2] || '';
    const poster = formatImageUrl(rawPoster);

    // Dynamic seasons count and max episodes count per season (if present)
    const rawSeasons = seasonsIdx !== -1 ? cols[seasonsIdx] : (cols[3] && !isNaN(parseInt(cols[3], 10)) ? cols[3] : '');
    const rawSEpisodes = sepisodesIdx !== -1 ? cols[sepisodesIdx] : (cols[4] && !isNaN(parseInt(cols[4], 10)) ? cols[4] : '');
    const parsedSeasons = parseInt(rawSeasons, 10);
    const parsedSEpisodes = parseInt(rawSEpisodes, 10);

    const episodesMap = new Map<string, Episode>();

    // Strategy 1: Map through explicit header mappings (e.g. s1e1, s1e2, s2e1...)
    for (const mapping of headerEpMappings) {
      const val = cols[mapping.colIdx]?.replace(/^["']|["']$/g, '').trim();
      if (val && (val.startsWith('http') || val.includes('.mp4') || val.includes('.mkv') || val.includes('.webm') || val.includes('/'))) {
        const key = `s${mapping.season}e${mapping.episode}`;
        episodesMap.set(key, {
          id: `ep-${i}-s${mapping.season}-e${mapping.episode}`,
          seasonNumber: mapping.season,
          episodeNumber: mapping.episode,
          title: `S${mapping.season}:E${mapping.episode}`,
          duration: '22m',
          synopsis: `${title} - Season ${mapping.season} Episode ${mapping.episode}`,
          thumbnail: poster || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop',
          videoUrl: val,
        });
      }
    }

    // Strategy 2: If no episodes found from header mapping but seasons and sepisodes are specified
    if (episodesMap.size === 0 && !isNaN(parsedSeasons) && parsedSeasons > 0) {
      const maxEpPerSeason = !isNaN(parsedSEpisodes) && parsedSEpisodes > 0 ? parsedSEpisodes : 10;
      const startEpCol = Math.max(posterIdx, seasonsIdx, sepisodesIdx, 2) + 1;

      for (let s = 1; s <= parsedSeasons; s++) {
        for (let e = 1; e <= maxEpPerSeason; e++) {
          const colIdx = startEpCol + (s - 1) * maxEpPerSeason + (e - 1);
          if (colIdx >= cols.length) break;
          const val = cols[colIdx]?.replace(/^["']|["']$/g, '').trim();
          if (val && (val.startsWith('http') || val.includes('.mp4') || val.includes('.mkv') || val.includes('/'))) {
            const key = `s${s}e${e}`;
            episodesMap.set(key, {
              id: `ep-${i}-s${s}-e${e}`,
              seasonNumber: s,
              episodeNumber: e,
              title: `S${s}:E${e}`,
              duration: '22m',
              synopsis: `${title} - Season ${s} Episode ${e}`,
              thumbnail: poster || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop',
              videoUrl: val,
            });
          }
        }
      }
    }

    // Strategy 3: Scan unmapped columns for SxxExx in URL / filename or key=value patterns
    for (let cIdx = 0; cIdx < cols.length; cIdx++) {
      if (cIdx === titleIdx || cIdx === yearIdx || cIdx === posterIdx || cIdx === seasonsIdx || cIdx === sepisodesIdx) {
        continue;
      }
      const rawVal = cols[cIdx]?.replace(/^["']|["']$/g, '').trim();
      if (!rawVal) continue;

      // Match "S1E3: https://..." or "S1E3=https://..."
      const kvMatch = rawVal.match(/^s(\d+)e(\d+)\s*[:=]\s*(https?:\/\/.+)/i);
      if (kvMatch) {
        const sNum = parseInt(kvMatch[1], 10);
        const eNum = parseInt(kvMatch[2], 10);
        const url = kvMatch[3].trim();
        const key = `s${sNum}e${eNum}`;
        if (!episodesMap.has(key)) {
          episodesMap.set(key, {
            id: `ep-${i}-s${sNum}-e${eNum}`,
            seasonNumber: sNum,
            episodeNumber: eNum,
            title: `S${sNum}:E${eNum}`,
            duration: '22m',
            synopsis: `${title} - Season ${sNum} Episode ${eNum}`,
            thumbnail: poster || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop',
            videoUrl: url,
          });
        }
        continue;
      }

      // Detect S01E02 directly inside the video URL or filename
      if (rawVal.startsWith('http') || rawVal.includes('.mp4') || rawVal.includes('.mkv')) {
        const urlMatch = rawVal.match(/S(\d+)E(\d+)/i) || rawVal.match(/Season[_\s-]*(\d+)[_\s-]*Episode[_\s-]*(\d+)/i);
        if (urlMatch) {
          const sNum = parseInt(urlMatch[1], 10);
          const eNum = parseInt(urlMatch[2], 10);
          const key = `s${sNum}e${eNum}`;
          if (!episodesMap.has(key)) {
            episodesMap.set(key, {
              id: `ep-${i}-s${sNum}-e${eNum}`,
              seasonNumber: sNum,
              episodeNumber: eNum,
              title: `S${sNum}:E${eNum}`,
              duration: '22m',
              synopsis: `${title} - Season ${sNum} Episode ${eNum}`,
              thumbnail: poster || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop',
              videoUrl: rawVal,
            });
          }
        }
      }
    }

    // Sort episodes by season ascending, then episode ascending
    const episodes = Array.from(episodesMap.values()).sort((a, b) => {
      if (a.seasonNumber !== b.seasonNumber) return a.seasonNumber - b.seasonNumber;
      return a.episodeNumber - b.episodeNumber;
    });

    const maxSeasonInEpisodes = episodes.reduce((max, ep) => Math.max(max, ep.seasonNumber), 0);
    const seasonsCount = !isNaN(parsedSeasons) && parsedSeasons > 0 ? parsedSeasons : (maxSeasonInEpisodes || 1);

    const defaultVideoUrl = episodes[0]?.videoUrl || '';

    const audioTracks: AudioTrack[] = defaultVideoUrl
      ? [
          {
            id: 'orig',
            language: 'Original',
            label: 'Original Audio',
            channels: 'Stereo / Multi-Track',
            codec: 'AAC/AC3',
            videoUrl: defaultVideoUrl,
            isOriginal: true,
            isDefault: true,
          },
        ]
      : [];

    const subtitleTracks: SubtitleTrack[] = [];
    const subUrl = subtitleIdx !== -1 ? cols[subtitleIdx]?.replace(/^["']|["']$/g, '').trim() : '';
    if (subUrl) {
      subtitleTracks.push({
        id: 'sub-0',
        language: 'English',
        label: 'English Subtitles',
        src: subUrl,
        isDefault: true,
      });
    }

    items.push({
      id: `series-csv-${i}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title,
      type: 'series',
      year,
      rating: 0,
      seasonsCount,
      genres: ['Action', 'Animation'],
      description: `${title} (${year}) • ${seasonsCount} Season${seasonsCount > 1 ? 's' : ''} • ${episodes.length} Episodes`,
      poster: poster || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop',
      banner: poster || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&auto=format&fit=crop',
      videoUrl: defaultVideoUrl,
      audioTracks,
      subtitleTracks,
      episodes,
    });
  }

  return items;
}

export async function fetchMoviesFromCSV(): Promise<MediaItem[]> {
  try {
    const res = await fetch(`/movies.csv?t=${Date.now()}`);
    if (!res.ok) return [];
    const text = await res.text();
    return parseMoviesCSV(text);
  } catch (err) {
    console.error('Error fetching movies.csv:', err);
    return [];
  }
}

export async function fetchSeriesFromCSV(): Promise<MediaItem[]> {
  try {
    const res = await fetch(`/series.csv?t=${Date.now()}`);
    if (!res.ok) return [];
    const text = await res.text();
    return parseSeriesCSV(text);
  } catch (err) {
    console.error('Error fetching series.csv:', err);
    return [];
  }
}
