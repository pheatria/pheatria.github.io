export default function CursorControl({ editorRef, onLineDelete }) {
  // 커서 이동 제어 함수
  function moveCursor(direction) {
    const el = editorRef.current;
    if (!el) return;

    let start = el.selectionStart;
    let end = el.selectionEnd;
    const text = el.value;

    switch (direction) {
      case "left":
        start = Math.max(0, start - 1);
        break;

      case "right":
        start = Math.min(text.length, start + 1);
        break;

      case "up": {
        // 현재 위치 이전의 줄바꿈('\n') 위치 찾기
        const lastNewLine = text.lastIndexOf("\n", start - 1);
        if (lastNewLine !== -1) {
          // 전전 줄바꿈 위치 찾기
          const prevNewLine = text.lastIndexOf("\n", lastNewLine - 1);
          // 윗줄의 동일한 열 위치(Offset) 계산 시도
          const colOffset = start - lastNewLine;
          start = Math.min(lastNewLine, prevNewLine + colOffset);
        } else {
          start = 0; // 첫 줄이면 맨 앞으로
        }
        break;
      }

      case "down": {
        // 현재 위치 이후의 줄바꿈('\n') 위치 찾기
        const nextNewLine = text.indexOf("\n", start);
        if (nextNewLine !== -1) {
          const currentNewLine = text.lastIndexOf("\n", start - 1);
          const colOffset = start - (currentNewLine === -1 ? 0 : currentNewLine + 1);
          const afterNextNewLine = text.indexOf("\n", nextNewLine + 1);
          const limit = afterNextNewLine === -1 ? text.length : afterNextNewLine;
          start = Math.min(limit, nextNewLine + 1 + colOffset);
        } else {
          start = text.length; // 마지막 줄이면 맨 끝으로
        }
        break;
      }

      case "lineStart": {
        const lineStart = text.lastIndexOf("\n", start - 1);
        start = lineStart === -1 ? 0 : lineStart + 1;
        break;
      }

      case "lineEnd": {
        const lineEnd = text.indexOf("\n", start);
        start = lineEnd === -1 ? text.length : lineEnd;
        break;
      }

      default:
        break;
    }

    // 커서 위치 변경 적용 및 포커스 유지
    el.setSelectionRange(start, start);
    el.focus();
  }

  return (
    <div className="cursor-control">
      <div className="cursor-buttons">
        <button onClick={() => moveCursor("left")}>◀</button>
        <button onClick={() => moveCursor("up")}>▲</button>
        <button onClick={() => moveCursor("down")}>▼</button>
        <button onClick={() => moveCursor("right")}>▶</button>
        <button onClick={() => moveCursor("lineStart")}>줄 맨앞</button>
        <button onClick={() => moveCursor("lineEnd")}>줄 맨뒤</button>
      </div>
    </div>
  );
}