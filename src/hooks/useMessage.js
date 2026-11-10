import { useCallback, useEffect, useRef, useState } from "react";

// "복사했어요" 같은 짧은 안내 문구를 잠깐 보여주고 지우는 훅.
// 원본의 say()에 해당합니다.
export default function useMessage(duration = 1800) {
  const [message, setMessage] = useState("");
  const timerRef = useRef(null); // 렌더링과 무관하게 값을 기억하는 상자

  const say = useCallback(
    (text) => {
      clearTimeout(timerRef.current); // 연속 클릭 시 앞의 타이머가 새 문구를 지우지 않게
      setMessage(text);
      timerRef.current = setTimeout(() => setMessage(""), duration);
    },
    [duration]
  );

  // 컴포넌트가 사라질 때 타이머 정리 (cleanup 함수)
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return [message, say];
}
