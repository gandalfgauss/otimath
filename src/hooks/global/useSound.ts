let audio: HTMLAudioElement | null = null;

export function playSound(src: string, volume = 1) {
  try {
    if (!audio || audio.src !== location.origin + src) {
      audio = new Audio(src);
    }
    audio.volume = volume;
    audio.currentTime = 0;
    const p = audio.play();
    if (p) p.catch(() => {});
  } catch {
    // Fallback: criar novo elemento
    try {
      audio = new Audio(src);
      audio.volume = volume;
      const p = audio.play();
      if (p) p.catch(() => {});
    } catch {
      // Ignorar
    }
  }
}