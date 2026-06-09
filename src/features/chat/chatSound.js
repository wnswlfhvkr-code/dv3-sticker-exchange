const CHAT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav';

let unlockListenersInstalled = false;
let audioUnlocked = false;

const createAudio = (volume = 0.55) => {
  const audio = new Audio(CHAT_SOUND_URL);
  audio.volume = volume;
  return audio;
};

export const installChatSoundUnlock = () => {
  if (unlockListenersInstalled || typeof window === 'undefined') return;
  unlockListenersInstalled = true;

  const unlock = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;
    try {
      const audio = createAudio(0);
      audio.play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => {
          audioUnlocked = false;
        });
    } catch {
      audioUnlocked = false;
    }
  };

  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
};

export const playChatNotificationSound = () => {
  try {
    const audio = createAudio();
    audio.play().catch(error => {
      console.log('알림음 재생 대기 (브라우저 상호작용 제약):', error);
    });
  } catch (error) {
    console.error('오디오 로드 에러:', error);
  }
};
