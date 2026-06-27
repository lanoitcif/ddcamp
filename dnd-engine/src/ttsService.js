const KOKORO_ENDPOINT = '/api/tts/v1/audio/speech';

// Voice profiles for Kokoro TTS.
// Each profile maps a VTT voiceId to a Kokoro voice ID and speed.
export const VOICE_PROFILES = {
  // Narrator / Default
  'onyx': { voice: 'am_onyx', speed: 1.0 },
  'narrator_deep': { voice: 'am_onyx', speed: 0.85 },
  
  // Monsters / NPCs
  'monster': { voice: 'am_fenrir', speed: 0.75 },
  'gruff_dwarf': { voice: 'am_adam', speed: 0.9 },
  'spooky_wisp': { voice: 'af_heart', speed: 0.95 },
  
  // Goblin companion
  'goblin': { voice: 'am_puck', speed: 1.4 },
};

/**
 * Attempts to play TTS via Kokoro. If the server is offline or fails,
 * falls back to browser's SpeechSynthesis (Web Speech API).
 * 
 * @param {string} text - Text to synthesize.
 * @param {string} voiceId - The custom voice identifier.
 * @param {function} onEnd - Callback when speaking finishes or is cancelled.
 * @returns {function} A cancel function to abort speaking.
 */
export function playTts(text, voiceId, onEnd) {
  let isCancelled = false;
  let activeAudio = null;

  const handleEnd = () => {
    if (onEnd) onEnd();
  };

  // Node compatibility check (for testing environments)
  if (typeof window === 'undefined') {
    handleEnd();
    return () => {};
  }

  // 1. Map the voice ID to a Kokoro voice and speed
  const profile = VOICE_PROFILES[voiceId] || VOICE_PROFILES['onyx'];
  
  // Try Kokoro local TTS first
  const controller = new AbortController();
  fetch(KOKORO_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      model: 'kokoro',
      input: text,
      voice: profile.voice,
      response_format: 'mp3',
      speed: profile.speed,
      stream: false,
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Kokoro server error: ${response.status}`);
      }
      const blob = await response.blob();
      if (isCancelled) return;

      const audioUrl = URL.createObjectURL(blob);
      activeAudio = new Audio(audioUrl);
      activeAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        handleEnd();
      };
      activeAudio.onerror = (e) => {
        console.error('Audio playback error, falling back to browser SpeechSynthesis:', e);
        URL.revokeObjectURL(audioUrl);
        fallbackSpeechSynthesis(text, voiceId, handleEnd);
      };
      
      activeAudio.play().catch((err) => {
        console.error('Failed to play local audio, falling back to browser SpeechSynthesis:', err);
        URL.revokeObjectURL(audioUrl);
        fallbackSpeechSynthesis(text, voiceId, handleEnd);
      });
    })
    .catch((err) => {
      if (isCancelled) return;
      console.warn('Kokoro TTS failed, falling back to browser SpeechSynthesis:', err.message);
      fallbackSpeechSynthesis(text, voiceId, handleEnd);
    });

  // Return a cancel function that stops whatever is active
  return () => {
    isCancelled = true;
    controller.abort();
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    }
    // Cancel browser synthesis just in case
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };
}

function fallbackSpeechSynthesis(text, voiceId, onEnd) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Squeaky/fast settings for the goblin
  if (voiceId === 'goblin') {
    utterance.pitch = 1.75;
    utterance.rate = 1.15;
  } else if (voiceId === 'monster') {
    utterance.pitch = 0.3;
    utterance.rate = 0.7;
  } else {
    utterance.pitch = 1.4;
    utterance.rate = 1.1;
  }

  const voices = window.speechSynthesis.getVoices();
  const engVoice = voices.find(v => v.lang.startsWith('en'));
  if (engVoice) utterance.voice = engVoice;

  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  
  window.speechSynthesis.speak(utterance);
}
