// Speech recognition and text-to-speech helpers

// Web Speech API interface definitions for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createSpeechRecognizer(
  onResult: (text: string, isFinal: boolean) => void,
  onError: (err: any) => void,
  onEnd: () => void,
  lang: string = "ar-SA"
) {
  if (!isSpeechRecognitionSupported()) {
    throw new Error("Speech recognition is not supported in this browser.");
  }

  const SpeechRecognitionClass =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognitionClass();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang;

  recognition.onresult = (event: any) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      onResult(finalTranscript, true);
    } else if (interimTranscript) {
      onResult(interimTranscript, false);
    }
  };

  recognition.onerror = (event: any) => {
    onError(event);
  };

  recognition.onend = () => {
    onEnd();
  };

  return recognition;
}

export function speakText(
  text: string,
  lang: string = "ar-SA",
  onEnd?: () => void
): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  window.speechSynthesis.cancel();

  // Strip Markdown markers for cleaner speech
  const cleanText = text
    .replace(/```[\s\S]*?```/g, "كود برمجي")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*#_~>]/g, "")
    .slice(0, 1000); // Limit length for TTS buffer safety

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = lang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Try to find matching Arabic voice if available
  const voices = window.speechSynthesis.getVoices();
  const arVoice = voices.find((v) => v.lang.startsWith("ar"));
  if (arVoice) {
    utterance.voice = arVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
