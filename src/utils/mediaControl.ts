/**
 * Utility to stop and tear down all active HTML5 Video, Audio, and media playback across the entire app.
 */
export function stopAllGlobalPlayback() {
  try {
    // 1. Dispatch custom event for React components (VideoPlayer, etc.) to immediately clean up refs
    window.dispatchEvent(new CustomEvent('popcorn:stop-playback'));

    // 2. Stop and reset all <video> elements in the DOM
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      try {
        video.pause();
        video.currentTime = 0;
        video.removeAttribute('src');
        video.load();
      } catch (e) {
        // ignore
      }
    });

    // 3. Stop and reset all <audio> elements in the DOM
    const audios = document.querySelectorAll('audio');
    audios.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.removeAttribute('src');
        audio.load();
      } catch (e) {
        // ignore
      }
    });
  } catch (err) {
    console.error('Error stopping global playback:', err);
  }
}
