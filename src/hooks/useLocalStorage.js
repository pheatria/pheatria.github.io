import { useEffect, useState } from "react";

// 원본의 load()/store() 함수를 "훅"으로 만든 것.
// useState처럼 쓰되, 값이 바뀔 때마다 localStorage에도 자동 저장됩니다.
//
//   const [draft, setDraft] = useLocalStorage("draft", "");
//
// 원본과 같은 key("draft", "snips", "fs")를 쓰므로 기존 저장 데이터도 그대로 이어집니다.
// (단, 같은 주소(origin)에서 열 때만. 파일로 열던 것과 localhost는 저장소가 따로입니다.)
export default function useLocalStorage(key, initialValue) {
  // useState에 "함수"를 넘기면 첫 렌더링 때 한 번만 실행됩니다 (lazy initializer).
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved === null ? initialValue : saved;
    } catch {
      return initialValue; // 시크릿 모드 등에서 localStorage가 막혀 있을 수 있음
    }
  });

  // value(또는 key)가 바뀐 뒤에 실행되는 "부수 효과"
  useEffect(() => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* 저장 실패는 무시 */
    }
  }, [key, value]);

  return [value, setValue];
}
