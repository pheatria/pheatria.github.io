import { useState, useLayoutEffect, useRef } from "react";
import useLocalStorage from "./hooks/useLocalStorage";
import useMessage from "./hooks/useMessage";
import Editor from "./components/Editor";
import SnippetBar from "./components/SnippetBar";
import FontSizeControl from "./components/FontSizeControl";
import LinkSection from "./components/LinkSection";

const SNIPPETS = ["『", "』","\u3000"];
const MIN_FONT = 4;
const MAX_FONT = 24;

export default function App() {
  // ── state: 화면을 바꾸는 값들 (localStorage에 자동 저장) ──
  const [draft, setDraft] = useLocalStorage("draft", "");
  const [fontRaw, setFontRaw] = useLocalStorage("fs", "11");
  const [recall, setRecall] = useLocalStorage("trash", "");
  const [message, say] = useMessage();

  // ── ref: 렌더링과 상관없이 기억해 둘 값들 ──
  const editorRef = useRef(null); // textarea DOM
  const nextCursor = useRef(null); // "다음 렌더 후 커서를 여기로 옮겨라"

  // ── 파생 값: state에서 계산할 수 있는 건 state로 또 저장하지 않는다 ──
  const fontSize = parseInt(fontRaw, 10) || 11;


  function changeFont(n) {
    const clamped = Math.max(MIN_FONT, Math.min(MAX_FONT, n));
    setFontRaw(String(clamped));
  }

  // 커서 위치에 s를 끼워 넣는다 (선택 영역이 있으면 대체)
  function insert(s) {
    const el = editorRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    setDraft(draft.slice(0, start) + s + draft.slice(end));
    nextCursor.current = start + s.length;
    el.focus();
  }

  // draft가 바뀌어 화면(DOM)이 갱신된 직후, 커서를 삽입한 글자 뒤로 옮긴다.
  // 이걸 안 하면 React가 값을 갈아끼우면서 커서가 맨 끝으로 튑니다.
  useLayoutEffect(() => {
    if (nextCursor.current !== null) {
      const pos = nextCursor.current;
      editorRef.current.setSelectionRange(pos, pos);
      nextCursor.current = null;
    }
  }, [draft]);

  function handleClear() {
    if (draft === "") return; 
    if (confirm("전체를 지울까요?")) {
      setRecall(draft);   // ← 지우기 전에 백업
      setDraft("");
    }
  }

  function handleRecall() {
    setDraft(recall);
  }

  async function handleCopy() {
    editorRef.current.select();
    try {
      await navigator.clipboard.writeText(draft);
      say("복사했어요");
    } catch {
      try {
        document.execCommand("copy"); // 구형 브라우저용 대비책
        say("복사했어요");
      } catch {
        say("길게 눌러 복사하세요");
      }
    }
  }

  async function handlePaste() {
    // 문서가 포커스를 잃은 상태라면 포커스 부여 시도
    window.focus();

    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        insert(text);
      } else {
        say("클립보드가 비어있습니다");
      }
    } catch (err) {
      console.error("클립보드 읽기 실패:", err);
      say("입력창을 길게 눌러 붙여넣으세요");
    }
  }

  return (
    <main>
      <h1>AA 입력 도우미</h1>

      <Editor ref={editorRef} text={draft} onChange={setDraft} fontSize={fontSize} />

      <SnippetBar snippets={SNIPPETS} onInsert={insert} />
      <FontSizeControl fontSize={fontSize} onChange={changeFont} />

      <div className="row">
        <button onClick={handlePaste}>붙여넣기</button>
        <button className="primary" onClick={handleCopy}>
          전체 복사
        </button>
        <button onClick={handleClear}>지우기</button>
        <button onClick={handleRecall} disabled={recall === ""}>되돌리기</button>
      </div>
      <small className="message">{message}</small>

      <LinkSection say={say} />

      <p>
        <small>폰트: Monapo (IPA Font License v1.0)</small>
      </p>
    </main>
  );
}
