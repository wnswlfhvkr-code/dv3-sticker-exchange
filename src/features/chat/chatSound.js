let unlockListenersInstalled = false;
let audioUnlocked = false;
let globalAudioCtx = null;

// 브라우저 첫 상호작용(터치/클릭) 시 AudioContext를 활성화하여 자동 재생 락을 해제합니다.
export const installChatSoundUnlock = () => {
  if (unlockListenersInstalled || typeof window === 'undefined') return;
  unlockListenersInstalled = true;

  const unlock = () => {
    if (audioUnlocked) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        globalAudioCtx = new AudioContext();
        if (globalAudioCtx.state === 'suspended') {
          globalAudioCtx.resume();
        }
        audioUnlocked = true;
      }
    } catch (e) {
      console.warn('AudioContext 활성화 실패:', e);
    }
  };

  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
};

// Web Audio API를 활용하여 외부 파일 로딩 없이 부드럽고 맑은 "띵동~" 알림음을 실시간 합성합니다.
// 외부 서버(Mixkit 등)의 CSP 및 로딩 지연 문제를 원천적으로 해결합니다.
export const playChatNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    // 만약 전역 컨텍스트가 없으면 새로 생성
    const ctx = globalAudioCtx || new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // 오실레이터(발진기) 노드와 게인(볼륨) 노드를 생성해 스피커에 연결
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // 맑은 벨소리에 알맞은 사인(Sine) 파형 지정
    osc.type = 'sine';

    // 맑은 "띵동" 소리 연주 주파수 설정 (C5: 523.25Hz -> G5: 783.99Hz)
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(783.99, now + 0.08);

    // 볼륨 조절 및 부드러운 페이드아웃 (0.35초 동안 볼륨을 자연스럽게 0으로 수렴)
    gain.gain.setValueAtTime(0.25, now); // 최대 볼륨 0.25 지정
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (error) {
    console.warn('Web Audio API 알림음 재생 오류:', error);
  }
};
