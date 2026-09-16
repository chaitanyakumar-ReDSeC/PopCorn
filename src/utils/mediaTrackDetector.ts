import { AudioTrack, SubtitleTrack } from '../types';

const LANGUAGE_CODE_MAP: Record<string, string> = {
  eng: 'English', en: 'English',
  hin: 'Hindi', hi: 'Hindi',
  spa: 'Spanish', es: 'Spanish',
  jpn: 'Japanese', ja: 'Japanese',
  fra: 'French', fre: 'French', fr: 'French',
  deu: 'German', ger: 'German', de: 'German',
  ita: 'Italian', it: 'Italian',
  por: 'Portuguese', pt: 'Portuguese',
  rus: 'Russian', ru: 'Russian',
  kor: 'Korean', ko: 'Korean',
  zho: 'Chinese', chi: 'Chinese', zh: 'Chinese',
  tel: 'Telugu', te: 'Telugu',
  tam: 'Tamil', ta: 'Tamil',
  kan: 'Kannada', kn: 'Kannada',
  mal: 'Malayalam', ml: 'Malayalam',
  ben: 'Bengali', bn: 'Bengali',
  mar: 'Marathi', mr: 'Marathi',
  guj: 'Gujarati', gu: 'Gujarati',
  pan: 'Punjabi', pa: 'Punjabi',
  ara: 'Arabic', ar: 'Arabic',
  tur: 'Turkish', tr: 'Turkish',
  pol: 'Polish', pl: 'Polish',
  vie: 'Vietnamese', vi: 'Vietnamese',
  tha: 'Thai', th: 'Thai',
  ind: 'Indonesian', id: 'Indonesian',
  nld: 'Dutch', dut: 'Dutch', nl: 'Dutch',
  swe: 'Swedish', sv: 'Swedish',
  nor: 'Norwegian', no: 'Norwegian',
  dan: 'Danish', da: 'Danish',
  fin: 'Finnish', fi: 'Finnish',
  ell: 'Greek', gre: 'Greek', el: 'Greek',
  heb: 'Hebrew', he: 'Hebrew',
  ces: 'Czech', cze: 'Czech', cs: 'Czech',
  hun: 'Hungarian', hu: 'Hungarian',
  ron: 'Romanian', rum: 'Romanian', ro: 'Romanian',
  ukr: 'Ukrainian', uk: 'Ukrainian',
  fil: 'Filipino', tl: 'Filipino',
  und: 'Original Audio',
};

export const formatLanguageName = (rawCode?: string, fallback = 'Original Audio'): string => {
  if (!rawCode) return fallback;
  const clean = rawCode.trim().toLowerCase();
  if (LANGUAGE_CODE_MAP[clean]) {
    return LANGUAGE_CODE_MAP[clean];
  }
  // Try 2 or 3 letter prefix
  const prefix2 = clean.slice(0, 2);
  if (LANGUAGE_CODE_MAP[prefix2]) {
    return LANGUAGE_CODE_MAP[prefix2];
  }
  const prefix3 = clean.slice(0, 3);
  if (LANGUAGE_CODE_MAP[prefix3]) {
    return LANGUAGE_CODE_MAP[prefix3];
  }
  // Capitalize raw code if reasonable length
  if (clean.length <= 15) {
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return fallback;
};

const formatAudioCodec = (rawCodec: string): string => {
  const c = rawCodec.toUpperCase();
  if (c.includes('AAC') || c.includes('MP4A')) return 'AAC';
  if (c.includes('EAC3') || c.includes('EC-3')) return 'Dolby Digital Plus (E-AC-3)';
  if (c.includes('AC3') || c.includes('AC-3')) return 'Dolby Digital (AC-3)';
  if (c.includes('DTS')) return 'DTS Digital Surround';
  if (c.includes('TRUEHD')) return 'Dolby TrueHD';
  if (c.includes('OPUS')) return 'Opus';
  if (c.includes('FLAC')) return 'FLAC Lossless';
  if (c.includes('VORBIS')) return 'Vorbis';
  if (c.includes('MPEG') || c.includes('MP3')) return 'MP3';
  if (c.includes('ALAC')) return 'Apple Lossless';
  if (c.includes('PCM')) return 'PCM Audio';
  return rawCodec || 'AAC/AC3';
};

const formatChannels = (ch?: number): string => {
  if (!ch) return 'Stereo / 5.1';
  if (ch === 1) return 'Mono (1.0)';
  if (ch === 2) return 'Stereo (2.0)';
  if (ch === 6) return '5.1 Surround';
  if (ch === 8) return '7.1 Surround';
  return `${ch} Channels`;
};

// Reads a slice of a File as ArrayBuffer safely
async function readSlice(file: File, start: number, end: number): Promise<ArrayBuffer> {
  const blob = file.slice(start, end);
  return await blob.arrayBuffer();
}

/**
 * Parses MKV / WebM container (EBML) to extract audio and subtitle tracks
 */
function parseEBMLTracks(buffer: ArrayBuffer): { audioTracks: AudioTrack[]; subtitleTracks: SubtitleTrack[] } {
  const audioTracks: AudioTrack[] = [];
  const subtitleTracks: SubtitleTrack[] = [];
  const view = new DataView(buffer);
  const total = buffer.byteLength;
  let offset = 0;

  // EBML Helper: Read Variable Length ID
  function readElementId(): { id: number; length: number } | null {
    if (offset >= total) return null;
    const firstByte = view.getUint8(offset);
    if (firstByte === 0) return null;

    let length = 1;
    let mask = 0x80;
    while (length <= 4 && (firstByte & mask) === 0) {
      mask >>= 1;
      length++;
    }
    if (length > 4 || offset + length > total) return null;

    let id = 0;
    for (let i = 0; i < length; i++) {
      id = (id << 8) | view.getUint8(offset + i);
    }
    offset += length;
    return { id, length };
  }

  // EBML Helper: Read Variable Length Size (VINT)
  function readElementSize(): number | null {
    if (offset >= total) return null;
    const firstByte = view.getUint8(offset);
    let length = 1;
    let mask = 0x80;
    while (length <= 8 && (firstByte & mask) === 0) {
      mask >>= 1;
      length++;
    }
    if (length > 8 || offset + length > total) return null;

    let size = firstByte & (mask - 1);
    for (let i = 1; i < length; i++) {
      size = (size * 256) + view.getUint8(offset + i);
    }
    offset += length;
    return size;
  }

  // Search for EBML Header and Segment
  // EBML Header: 0x1A45DFA3
  // Tracks: 0x1654AE6B
  // Let's find Tracks element directly by scanning if needed
  let tracksOffset = -1;
  let tracksSize = -1;

  for (let i = 0; i < total - 8; i++) {
    if (
      view.getUint8(i) === 0x16 &&
      view.getUint8(i + 1) === 0x54 &&
      view.getUint8(i + 2) === 0xae &&
      view.getUint8(i + 3) === 0x6b
    ) {
      offset = i + 4;
      const size = readElementSize();
      if (size !== null && size > 0) {
        tracksOffset = offset;
        tracksSize = Math.min(size, total - offset);
        break;
      }
    }
  }

  if (tracksOffset === -1) {
    return { audioTracks, subtitleTracks };
  }

  const tracksEnd = tracksOffset + tracksSize;
  offset = tracksOffset;

  let audioIndex = 0;
  let subIndex = 0;

  while (offset < tracksEnd) {
    const el = readElementId();
    if (!el) break;
    const size = readElementSize();
    if (size === null) break;

    const nextElOffset = offset + size;

    // TrackEntry: 0xAE
    if (el.id === 0xae) {
      const entryEnd = Math.min(nextElOffset, tracksEnd);
      let trackType = 0;
      let trackName = '';
      let language = '';
      let codecId = '';
      let channels = 2;

      while (offset < entryEnd) {
        const childEl = readElementId();
        if (!childEl) break;
        const childSize = readElementSize();
        if (childSize === null) break;

        const childEnd = Math.min(offset + childSize, entryEnd);

        // TrackType: 0x83 (1: video, 2: audio, 17: subtitle)
        if (childEl.id === 0x83) {
          if (childSize >= 1) trackType = view.getUint8(offset);
        } else if (childEl.id === 0x536e) {
          // Track Name: 0x536E (UTF-8 string)
          const bytes = new Uint8Array(buffer, offset, childSize);
          trackName = new TextDecoder().decode(bytes).replace(/\0/g, '').trim();
        } else if (childEl.id === 0x22b59c || childEl.id === 0x22b59d) {
          // Language: 0x22B59C or LanguageBCP47: 0x22B59D
          const bytes = new Uint8Array(buffer, offset, childSize);
          language = new TextDecoder().decode(bytes).replace(/\0/g, '').trim();
        } else if (childEl.id === 0x86) {
          // CodecID: 0x86
          const bytes = new Uint8Array(buffer, offset, childSize);
          codecId = new TextDecoder().decode(bytes).replace(/\0/g, '').trim();
        } else if (childEl.id === 0xe1) {
          // Audio Master Element
          let aOffset = offset;
          while (aOffset < childEnd) {
            const aFirstByte = view.getUint8(aOffset);
            let aIdLen = 1;
            let aMask = 0x80;
            while (aIdLen <= 4 && (aFirstByte & aMask) === 0) {
              aMask >>= 1;
              aIdLen++;
            }
            if (aOffset + aIdLen > childEnd) break;
            let aId = 0;
            for (let k = 0; k < aIdLen; k++) aId = (aId << 8) | view.getUint8(aOffset + k);
            aOffset += aIdLen;

            const aSzByte = view.getUint8(aOffset);
            let aSzLen = 1;
            let aSzMask = 0x80;
            while (aSzLen <= 8 && (aSzByte & aSzMask) === 0) {
              aSzMask >>= 1;
              aSzLen++;
            }
            if (aOffset + aSzLen > childEnd) break;
            let aSize = aSzByte & (aSzMask - 1);
            for (let k = 1; k < aSzLen; k++) aSize = (aSize * 256) + view.getUint8(aOffset + k);
            aOffset += aSzLen;

            // Channels: 0x9F
            if (aId === 0x9f && aSize >= 1) {
              channels = view.getUint8(aOffset);
            }
            aOffset += aSize;
          }
        }

        offset = childEnd;
      }

      if (trackType === 2) {
        // Audio Track
        const langDisplay = formatLanguageName(language, audioIndex === 0 ? 'Original [Track 1]' : `Audio Track ${audioIndex + 1}`);
        const label = trackName || `${langDisplay} (${formatChannels(channels)})`;

        audioTracks.push({
          id: `aud-mkv-${audioIndex}`,
          language: langDisplay,
          label,
          channels: formatChannels(channels),
          codec: formatAudioCodec(codecId || 'AAC'),
          isOriginal: audioIndex === 0,
          isDefault: audioIndex === 0,
          nativeTrackIndex: audioIndex,
        });
        audioIndex++;
      } else if (trackType === 17) {
        // Subtitle Track
        const langDisplay = formatLanguageName(language, `Subtitle ${subIndex + 1}`);
        subtitleTracks.push({
          id: `sub-mkv-${subIndex}`,
          language: langDisplay,
          label: trackName || `${langDisplay} Subtitle`,
          isDefault: subIndex === 0,
        });
        subIndex++;
      }
    }

    offset = nextElOffset;
  }

  return { audioTracks, subtitleTracks };
}

/**
 * Parses MP4 / MOV / M4V container (ISOBMFF) to extract audio and subtitle tracks
 */
function parseMP4Tracks(buffer: ArrayBuffer): { audioTracks: AudioTrack[]; subtitleTracks: SubtitleTrack[] } {
  const audioTracks: AudioTrack[] = [];
  const subtitleTracks: SubtitleTrack[] = [];
  const view = new DataView(buffer);
  const total = buffer.byteLength;

  function readAscii(offset: number, length: number): string {
    let s = '';
    for (let i = 0; i < length; i++) {
      s += String.fromCharCode(view.getUint8(offset + i));
    }
    return s;
  }

  // Find moov box
  let moovOffset = -1;
  let moovSize = -1;

  let offset = 0;
  while (offset < total - 8) {
    const size = view.getUint32(offset);
    const type = readAscii(offset + 4, 4);

    let actualSize = size;
    let headerSize = 8;
    if (size === 1) {
      if (offset + 16 > total) break;
      actualSize = Number(view.getBigUint64(offset + 8));
      headerSize = 16;
    } else if (size === 0) {
      actualSize = total - offset;
    }

    if (type === 'moov') {
      moovOffset = offset + headerSize;
      moovSize = actualSize - headerSize;
      break;
    }

    if (actualSize <= 0) break;
    offset += actualSize;
  }

  if (moovOffset === -1) {
    return { audioTracks, subtitleTracks };
  }

  const moovEnd = Math.min(moovOffset + moovSize, total);
  offset = moovOffset;

  let audioIndex = 0;
  let subIndex = 0;

  while (offset < moovEnd - 8) {
    const size = view.getUint32(offset);
    const type = readAscii(offset + 4, 4);

    let actualSize = size;
    let headerSize = 8;
    if (size === 1) {
      if (offset + 16 > moovEnd) break;
      actualSize = Number(view.getBigUint64(offset + 8));
      headerSize = 16;
    } else if (size === 0) {
      actualSize = moovEnd - offset;
    }

    const nextBox = offset + actualSize;

    if (type === 'trak') {
      const trakEnd = Math.min(nextBox, moovEnd);
      let trakOffset = offset + headerSize;

      let handlerType = '';
      let languageCode = '';
      let trackName = '';
      let audioChannels = 2;
      let audioCodec = 'AAC';

      while (trakOffset < trakEnd - 8) {
        const subSize = view.getUint32(trakOffset);
        const subType = readAscii(trakOffset + 4, 4);
        if (subSize <= 0 || trakOffset + subSize > trakEnd) break;

        if (subType === 'mdia') {
          let mdiaOffset = trakOffset + 8;
          const mdiaEnd = trakOffset + subSize;

          while (mdiaOffset < mdiaEnd - 8) {
            const mSize = view.getUint32(mdiaOffset);
            const mType = readAscii(mdiaOffset + 4, 4);
            if (mSize <= 0 || mdiaOffset + mSize > mdiaEnd) break;

            if (mType === 'hdlr') {
              // Handler type at offset 16
              if (mSize >= 20) {
                handlerType = readAscii(mdiaOffset + 16, 4).toLowerCase();
              }
            } else if (mType === 'mdhd') {
              // Language code at offset 28 (v0) or offset 40 (v1)
              const version = view.getUint8(mdiaOffset + 8);
              const langOffset = mdiaOffset + (version === 1 ? 40 : 28);
              if (mdiaOffset + mSize >= langOffset + 2) {
                const langNum = view.getUint16(langOffset);
                const c1 = String.fromCharCode(((langNum >> 10) & 0x1f) + 0x60);
                const c2 = String.fromCharCode(((langNum >> 5) & 0x1f) + 0x60);
                const c3 = String.fromCharCode((langNum & 0x1f) + 0x60);
                languageCode = (c1 + c2 + c3).toLowerCase();
              }
            } else if (mType === 'minf') {
              // Look into stbl -> stsd for codec and channels
              let minfOffset = mdiaOffset + 8;
              const minfEnd = mdiaOffset + mSize;
              while (minfOffset < minfEnd - 8) {
                const stblSize = view.getUint32(minfOffset);
                const stblType = readAscii(minfOffset + 4, 4);
                if (stblSize <= 0) break;
                if (stblType === 'stbl') {
                  let stblOffset = minfOffset + 8;
                  const stblEnd = minfOffset + stblSize;
                  while (stblOffset < stblEnd - 8) {
                    const stsdSize = view.getUint32(stblOffset);
                    const stsdType = readAscii(stblOffset + 4, 4);
                    if (stsdSize <= 0) break;
                    if (stsdType === 'stsd' && stsdSize >= 24) {
                      // stsd box: 8 bytes header + 8 bytes (version, flags, count) + entry
                      const entryType = readAscii(stblOffset + 16, 4);
                      audioCodec = formatAudioCodec(entryType);
                      // In audio sample entries, channel count is 16-bit uint at offset 16 of sample entry (i.e. stblOffset + 32)
                      if (stsdSize >= 34) {
                        const ch = view.getUint16(stblOffset + 32);
                        if (ch > 0 && ch <= 16) {
                          audioChannels = ch;
                        }
                      }
                    }
                    stblOffset += stsdSize;
                  }
                }
                minfOffset += stblSize;
              }
            }

            mdiaOffset += mSize;
          }
        } else if (subType === 'udta') {
          // Check for track name in udta
          let udtaOffset = trakOffset + 8;
          const udtaEnd = trakOffset + subSize;
          while (udtaOffset < udtaEnd - 8) {
            const uSize = view.getUint32(udtaOffset);
            const uType = readAscii(udtaOffset + 4, 4);
            if (uSize <= 0) break;
            if (uType === 'name' || uType === 'titl') {
              let str = '';
              for (let i = 8; i < Math.min(uSize, 64); i++) {
                const b = view.getUint8(udtaOffset + i);
                if (b >= 32 && b <= 126) str += String.fromCharCode(b);
              }
              if (str.trim()) trackName = str.trim();
            }
            udtaOffset += uSize;
          }
        }

        trakOffset += subSize;
      }

      if (handlerType === 'soun') {
        const langDisplay = formatLanguageName(
          languageCode,
          audioIndex === 0 ? 'English [Original]' : `Audio Track ${audioIndex + 1}`
        );
        const label = trackName || (audioIndex === 0 ? `${langDisplay} (Default)` : `${langDisplay} (${formatChannels(audioChannels)})`);

        audioTracks.push({
          id: `aud-mp4-${audioIndex}`,
          language: langDisplay,
          label,
          channels: formatChannels(audioChannels),
          codec: audioCodec,
          isOriginal: audioIndex === 0,
          isDefault: audioIndex === 0,
          nativeTrackIndex: audioIndex,
        });
        audioIndex++;
      } else if (handlerType === 'subt' || handlerType === 'sbtl' || handlerType === 'text') {
        const langDisplay = formatLanguageName(languageCode, `Subtitle ${subIndex + 1}`);
        subtitleTracks.push({
          id: `sub-mp4-${subIndex}`,
          language: langDisplay,
          label: trackName || `${langDisplay} Subtitle`,
          isDefault: subIndex === 0,
        });
        subIndex++;
      }
    }

    if (actualSize <= 0) break;
    offset = nextBox;
  }

  return { audioTracks, subtitleTracks };
}

/**
 * Main detection entry point: Reads local video file and detects all embedded audio and subtitle tracks.
 */
export async function detectMediaTracksFromFile(
  file: File
): Promise<{ audioTracks: AudioTrack[]; subtitleTracks: SubtitleTrack[] }> {
  try {
    // Read up to first 12MB of file
    const headSize = Math.min(12 * 1024 * 1024, file.size);
    const headBuffer = await readSlice(file, 0, headSize);

    const fileName = file.name.toLowerCase();
    const isMkv = fileName.endsWith('.mkv') || fileName.endsWith('.webm');

    let result: { audioTracks: AudioTrack[]; subtitleTracks: SubtitleTrack[] } = {
      audioTracks: [],
      subtitleTracks: [],
    };

    if (isMkv) {
      result = parseEBMLTracks(headBuffer);
    } else {
      // Try MP4 parsing
      result = parseMP4Tracks(headBuffer);

      // If moov wasn't found in the first slice (e.g. moov at end of MP4), read the tail
      if (result.audioTracks.length === 0 && file.size > headSize) {
        const tailSize = Math.min(8 * 1024 * 1024, file.size);
        const tailStart = file.size - tailSize;
        const tailBuffer = await readSlice(file, tailStart, file.size);
        result = parseMP4Tracks(tailBuffer);
      }
    }

    // If MKV parse failed or returned 0 tracks, try the other parser just in case container extension differs
    if (result.audioTracks.length === 0) {
      if (isMkv) {
        result = parseMP4Tracks(headBuffer);
      } else {
        result = parseEBMLTracks(headBuffer);
      }
    }

    // If tracks were detected, return them!
    if (result.audioTracks.length > 0) {
      return result;
    }
  } catch (err) {
    console.warn('Container track parsing encountered non-fatal error:', err);
  }

  // Graceful fallback for single-track or unrecognized files:
  return {
    audioTracks: [
      {
        id: 'aud-loc-orig',
        language: 'Original Audio',
        label: 'Original Audio (Default Track)',
        channels: 'Stereo / 5.1',
        codec: 'AAC/AC3',
        isOriginal: true,
        isDefault: true,
        nativeTrackIndex: 0,
      },
    ],
    subtitleTracks: [],
  };
}
