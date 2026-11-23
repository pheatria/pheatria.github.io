
import { useEffect, useState } from "react";
import { openDB } from "idb";

const DB_NAME = "aa-library";
const STORE_NAME = "aas";

// IndexedDB 연결
const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, {
        keyPath: "id",
      });
    }
  },
});

// 전체 AA 조회
async function getAllAAs() {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
}

// AA 저장
async function addAA(aa) {
  const db = await dbPromise;
  return db.add(STORE_NAME, aa);
}

// AA 삭제
async function deleteAA(id) {
  const db = await dbPromise;
  return db.delete(STORE_NAME, id);
}

export default function LinkSection({ say }) {
  const [aas, setAas] = useState([]);
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  // 저장된 AA 불러오기
  async function loadAAs() {
    try {
      const data = await getAllAAs();

      // 최근 저장한 순서대로 표시
      data.sort((a, b) => b.createdAt - a.createdAt);

      setAas(data);
    } catch (error) {
      console.error("AA 불러오기 실패:", error);
      say?.("AA 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAAs();
  }, []);

  // AA 등록
  async function handleAdd(e) {
    e.preventDefault();

    const name = label.trim();
    const text = content.trim();

    if (!name || !text) {
      say?.("이름과 AA 원문을 입력하세요.");
      return;
    }

    const newAA = {
      id: crypto.randomUUID(),
      name,
      content: text,
      createdAt: Date.now(),
    };

    try {
      await addAA(newAA);

      setLabel("");
      setContent("");

      await loadAAs();

      say?.("AA를 저장했습니다.");
    } catch (error) {
      console.error("AA 저장 실패:", error);
      say?.("AA 저장에 실패했습니다.");
    }
  }

  // AA 복사
  async function handleCopy(aa) {
    try {
      await navigator.clipboard.writeText(aa.content);
      say?.(`${aa.name} 복사 완료`);
    } catch (error) {
      console.error("AA 복사 실패:", error);
      say?.("클립보드 복사에 실패했습니다.");
    }
  }

  // AA 삭제
  async function handleRemove(id) {
    if (!confirm("이 AA를 삭제할까요?")) return;

    try {
      await deleteAA(id);
      await loadAAs();
      say?.("AA를 삭제했습니다.");
    } catch (error) {
      console.error("AA 삭제 실패:", error);
      say?.("AA 삭제에 실패했습니다.");
    }
  }

  return (
    <section className="aa-library">
      <form className="link-form" onSubmit={handleAdd}>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="AA 이름 (예: 시로 - 기본 표정)"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="AA 원문을 붙여넣으세요."
          rows={8}
          spellCheck={false}
        />

        <button type="submit" className="primary">
          ＋ AA 저장
        </button>
      </form>

      <div className="aa-library-header">
        <strong>저장된 AA ({aas.length})</strong>
      </div>

      {loading ? (
        <p>불러오는 중...</p>
      ) : aas.length === 0 ? (
        <p className="aa-empty">
          저장된 AA가 없습니다.
        </p>
      ) : (
        <ul className="aa-list">
          {aas.map((aa) => (
            <li key={aa.id} className="aa-item">
              <div className="aa-item-header">
                <strong>{aa.name}</strong>

                <div className="aa-item-actions">
                  <button
                    type="button"
                    onClick={() => handleCopy(aa)}
                  >
                    복사
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(aa.id)}
                    aria-label={`${aa.name} 삭제`}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <pre className="aa-preview">
                {aa.content}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
