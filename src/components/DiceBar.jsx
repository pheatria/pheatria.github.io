import { useState } from "react";

const DICE_TEXT = 
`1 펌블
2-4 
5-7 
8-10 
0 크리티컬`;

export default function DiceBar({ onInsert }) {
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("10");

  function handleDiceInsert() {
    // 입력값이 없으면 기본값 1과 10을 사용
    const minVal = min.trim() || "1";
    const maxVal = max.trim() || "10";
    onInsert(`[dice ${minVal} ${maxVal}]`);
  }

  return (
    <div className="row">
      {/* 1. 다이스식 텍스트 삽입 버튼 */}
      <button onClick={() => onInsert(DICE_TEXT)}>다이스식</button>

      {/* 2. 주사위 범위 입력 및 [dice min max] 생성 영역 */}
      <div className="dice-input-group">
        <input
          type="number"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          placeholder="최소"
        />
        <span>~</span>
        <input
          type="number"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          placeholder="최대"
        />
        <button onClick={handleDiceInsert}>주사위 추가</button>
      </div>
    </div>
  );
}