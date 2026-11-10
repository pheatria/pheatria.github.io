import { useState } from "react";

export default function VoiceInput({ onInsert, say }) {
  const [isListening, setIsListening] = useState(false);

  function startSpeech() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      say("이 브라우저는 음성 인식을 지원하지 않습니다.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      say("음성 인식 중... 대사를 말씀하세요");
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      if (text) {
        // 💡 핵심: 기존 insert() 함수를 호출해서 현재 커서 위치에 바로 삽입!
        onInsert(text);
        say("음성 입력 완료!");
      }
    };

    recognition.onerror = (event) => {
      console.error(event.error);
      say("음성 인식 실패");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }

  return (
    <button
      onClick={startSpeech}
      style={{
        backgroundColor: isListening ? "#ff4d4f" : "",
        color: isListening ? "#fff" : "",
      }}
    >
      {isListening ? "🎙️ 듣는 중..." : "🎤 음성 대사"}
    </button>
  );
}