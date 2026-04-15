let audio: HTMLAudioElement | null = null;

export function playNotificationSound() {
  if (!audio) audio = new Audio("/notification.wav");
  audio.currentTime = 0;
  audio.play().catch(() => { });
}
