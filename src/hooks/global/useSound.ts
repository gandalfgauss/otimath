let audio: HTMLAudioElement | null = null;

export function playSound(src: string, volume = 1) {
  if (!audio || audio.src !== location.origin + src) {
    audio = new Audio(src);
    audio.volume = volume;
  }

  audio.currentTime = 0;
  audio.play();
}