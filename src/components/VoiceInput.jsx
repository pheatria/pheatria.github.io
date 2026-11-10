import { useState } from "react";

export default function VoiceInput({ onInsert, say }) {
  const [isListening, setIsListening] = useState(false);

  function startSpeech() {
    // 브라우저 음성 인식 API 지원 여부 확인
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      say("이 브라우저는 음성 인식을 지원하지 않습니다.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR"; // 한국어 설정
    recognition.interimResults = false; // 최종 결과만 가져옴

    recognition.onstart = () => {
      setIsListening(true);
      say("음성 인식 중... 대사를 말씀하세요");
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      if (text) {
        onInsert(text); // 읽어들인 텍스트를 현재 커서 위치에 삽입!
        say("음성 입력 완료!");
      }
    };

    recognition.onerror = (event) => {
      console.error(event.error);
      say("음성 인식에 실패했습니다.");
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
      className={isListening ? "listening" : ""}
      style={{ backgroundColor: isListening ? "#ff4d4f" : "" }}
    >
      {isListening ? "🎙️ 듣는 중..." : "🎤 음성 대사 입력"}
    </button>
  );
}