// AA를 입력하는 큰 textarea.
// 부모(App)가 text와 ref를 내려줍니다. ref는 "커서 위치" 같은 DOM 정보를 읽기 위해 필요합니다.
// (React 19부터는 forwardRef 없이 ref를 일반 prop처럼 받을 수 있습니다.)
export default function Editor({ text, onChange, fontSize, ref }) {
  return (
    <textarea
      ref={ref}
      className="editor"
      value={text}
      onChange={(e) => onChange(e.target.value)}
      style={{ fontSize: fontSize + "px" }}
      placeholder="여기에 AA를 붙여넣고, 아래 버튼으로 기호를 넣으세요"
      spellCheck={false}
      autoCapitalize="off"
      autoComplete="off"
    />
  );
}
