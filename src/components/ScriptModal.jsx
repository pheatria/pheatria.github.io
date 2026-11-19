import { useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage";

function parseScriptLines(raw) {
  if (!raw.trim()) return [];
  const lines = raw.split("\n");
  const result = [];
  let currentSpeaker = "";

  lines.forEach((line, idx) => {
    if (!line.trim()) return;

    if (/^[\u3000\s]*【.+】/.test(line)) {
      currentSpeaker = "지문";
      result.push({
        id: `${idx}-${line}`,
        speaker: "지문",
        text: line.trim(),
        isNewBlock: true,
      });
      return;
    }

    const match = line.match(/^([^\s\u3000]+)[\u3000\s]{2,}(.*)$/);
    if (match) {
      currentSpeaker = match[1];
      result.push({
        id: `${idx}-${line}`,
        speaker: currentSpeaker,
        text: match[2].trim(),
        isNewBlock: true,
      });
    } else {
      result.push({
        id: `${idx}-${line}`,
        speaker: currentSpeaker,
        text: line.replace(/^[\u3000\s]+/, ""),
        isNewBlock: false,
      });
    }
  });

  return result;
}

export default function ScriptModal({ isOpen, onClose, onSelectLine, say }) {
  const [rawScript, setRawScript] = useLocalStorage("script_raw", "");
  const [usedIds, setUsedIds] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]); // X 눌러서 숨긴 줄 ID 목록
  const [isEditMode, setIsEditMode] = useState(!rawScript);

  if (!isOpen) return null;

  // 삭제(X)된 줄은 필터링해서 목록에서 제외
  const parsedLines = parseScriptLines(rawScript).filter(
    (item) => !deletedIds.includes(item.id)
  );

  async function handlePasteScript() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawScript(text);
        setUsedIds([]);
        setDeletedIds([]);
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
    onSelectLine(item.text);
    if (!usedIds.includes(item.id)) {
      setUsedIds([...usedIds, item.id]);
    }
    onClose();
  }

  // X 버튼 클릭 시 목록에서 제거
  function handleDeleteLine(e, id) {
    e.stopPropagation(); // 부모 클릭(에디터 삽입) 방지
    setDeletedIds([...deletedIds, id]);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <strong>대본 줄별 삽입</strong>
          <div style={{ display: "flex", gap: "6px" }}>
            {deletedIds.length > 0 && !isEditMode && (
              <button onClick={() => setDeletedIds([])}>복구</button>
            )}
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
                  setDeletedIds([]);
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
                setDeletedIds([]);
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
                남은 대본이 없습니다. [대본 수정]이나 [복구]를 눌러주세요.
              </p>
            ) : (
              parsedLines.map((item) => {
                const isUsed = usedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`script-line-row ${item.isNewBlock ? "new-block" : ""}`}
                  >
                    <button
                      className={`script-line-btn ${isUsed ? "used" : ""}`}
                      onClick={() => handleLineClick(item)}
                    >
                      {item.isNewBlock && item.speaker && (
                        <span className="speaker-badge">{item.speaker}</span>
                      )}
                      <span className="line-text">{item.text}</span>
                    </button>
                    <button
                      className="script-del-btn"
                      onClick={(e) => handleDeleteLine(e, item.id)}
                      aria-label="줄 삭제"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
