import { useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage";

// 대본 텍스트를 줄별로 정리 (화자명 및 앞쪽 공백 제거, 화자 뱃지는 표시용으로 분리)
function parseScriptLines(raw) {
  if (!raw.trim()) return [];
  const lines = raw.split("\n");
  const result = [];
  let currentSpeaker = "";

  lines.forEach((line, idx) => {
    // 완전히 빈 줄은 제외
    if (!line.trim()) return;

    // 1. 【 잠시 후 】 같은 지문 줄
    if (/^[ \s]*【.+】/.test(line)) {
      currentSpeaker = "지문";
      result.push({
        id: `${idx}-${line}`,
        speaker: "지문",
        text: line.trim(),
        isNewBlock: true,
      });
      return;
    }

    // 2. "화자 + 공백 2칸 이상 + 대사" 형태
    const match = line.match(/^([^\s ]+)[ \s]{2,}(.*)$/);
    if (match) {
      currentSpeaker = match[1];
      result.push({
        id: `${idx}-${line}`,
        speaker: currentSpeaker,
        text: match[2].trim(),
        isNewBlock: true,
      });
    } else {
      // 3. 둘째 줄 이상 이어지는 대사 (앞쪽 전각/반각 공백만 제거)
      result.push({
        id: `${idx}-${line}`,
        speaker: currentSpeaker,
        text: line.replace(/^[ \s]+/, ""),
        isNewBlock: false,
      });
    }
  });

  return result;
}

export default function ScriptModal({ isOpen, onClose, onSelectLine, say }) {
  const [rawScript, setRawScript] = useLocalStorage("script_raw", "");
  const [usedIds, setUsedIds] = useLocalStorage("script_used", []);
  const [isEditMode, setIsEditMode] = useState(!rawScript);

  if (!isOpen) return null;

  const parsedLines = parseScriptLines(rawScript);

  async function handlePasteScript() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawScript(text);
        setUsedIds([]);
        setIsEditMode(false);
        say("대본을 불러왔어요");
      } else {
        say("클립보드가 비어있습니다");
      }
    } catch {
      say("입력창에 직접 붙여넣어 주세요");
    }
  }

  function handleLineClick(item) {
    // 1. 에디터 커서 위치에 해당 줄 텍스트 삽입
    onSelectLine(item.text);

    // 2. 사용한 줄로 표시 (중복 추가 방지)
    if (!usedIds.includes(item.id)) {
      setUsedIds([...usedIds, item.id]);
    }

    // 3. 팝업 닫고 에디터로 복귀
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <strong>대본 줄별 삽입</strong>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => setIsEditMode(!isEditMode)}>
              {isEditMode ? "목록 보기" : "대본 수정"}
            </button>
            <button onClick={onClose}>닫기</button>
          </div>
        </div>

        {isEditMode ? (
          <div className="modal-body">
            <div className="row" style={{ marginTop: 0 }}>
              <button className="primary" onClick={handlePasteScript}>
                클립보드 대본 붙여넣기
              </button>
              <button
                onClick={() => {
                  setRawScript("");
                  setUsedIds([]);
                }}
              >
                비우기
              </button>
            </div>
            <textarea
              className="script-input"
              value={rawScript}
              onChange={(e) => {
                setRawScript(e.target.value);
                setUsedIds([]);
              }}
              placeholder="여기에 대본 전체를 붙여넣으세요..."
            />
            <button
              className="primary"
              style={{ width: "100%", marginTop: "8px", minHeight: "40px" }}
              onClick={() => setIsEditMode(false)}
            >
              줄별로 정리하기 ({parsedLines.length}줄)
            </button>
          </div>
        ) : (
          <div className="modal-body script-list">
            {parsedLines.length === 0 ? (
              <p style={{ opacity: 0.7, textAlign: "center" }}>
                불러온 대본이 없습니다. [대본 수정]을 눌러 붙여넣으세요.
              </p>
            ) : (
              parsedLines.map((item) => {
                const isUsed = usedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    className={`script-line-btn ${isUsed ? "used" : ""} ${
                      item.isNewBlock ? "new-block" : ""
                    }`}
                    onClick={() => handleLineClick(item)}
                  >
                    {item.isNewBlock && item.speaker && (
                      <span className="speaker-badge">{item.speaker}</span>
                    )}
                    <span className="line-text">{item.text}</span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
