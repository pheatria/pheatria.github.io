// 기호 버튼 줄. snippets는 문자열 배열입니다. 예: ["「", "」", "　", "※"]
//
// 전각 공백(　)만으로 된 버튼은 "전각×7" 라벨이 붙고, 누르면 7칸이 한 번에 들어갑니다.

const FULLWIDTH_ONLY = /^　+$/;

function labelOf(s) {
  if (FULLWIDTH_ONLY.test(s)) return "전각×7";
  return s.trim() === "" ? "공백" : s;
}

function textOf(s) {
  return FULLWIDTH_ONLY.test(s) ? "　".repeat(7) : s;
}

export default function SnippetBar({ snippets, onInsert }) {
  return (
    <div className="row">
      {snippets.map((s, i) => (
        <button
          key={i}
          // 버튼을 눌러도 textarea가 포커스를 잃지 않게(= 모바일 키보드가 안 닫히게) 막는다
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => onInsert(textOf(s))}
        >
          {labelOf(s)}
        </button>
      ))}
    </div>
  );
}
