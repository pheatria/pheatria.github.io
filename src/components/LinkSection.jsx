
import { useEffect, useRef, useState } from "react";
import { openDB } from "idb";

const DB_NAME = "aa-library";
const STORE_NAME = "aas";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, {
        keyPath: "id",
      });
    }
  },
});

async function getAllAAs() {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
}

async function addAA(aa) {
  const db = await dbPromise;
  return db.add(STORE_NAME, aa);
}

async function deleteAA(id) {
  const db = await dbPromise;
  return db.delete(STORE_NAME, id);
}

export default function LinkSection({ say }) {
  const [aas, setAas] = useState([]);
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const searchRef = useRef(null);

  async function loadAAs() {
    try {
      const data = await getAllAAs();
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

  // 팝업을 열면 검색창에 포커스
  useEffect(() => {
    if (isOpen) {
      searchRef.current?.focus();
    }
  }, [isOpen]);

  // AA 등록
  async function handleAdd(e) {
    e.preventDefault();

    const name = label.trim();
    const text = content;

    if (!name || !text.trim()) {
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
  async function handleRemove(aa) {
    if (!confirm(`"${aa.name}"을(를) 삭제할까요?`)) return;

    try {
      await deleteAA(aa.id);
      await loadAAs();
      say?.("AA를 삭제했습니다.");
    } catch (error) {
      console.error("AA 삭제 실패:", error);
      say?.("AA 삭제에 실패했습니다.");
    }
  }

  // 검색 결과
  const filteredAAs = aas.filter((aa) =>
    aa.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  // 팝업 닫기
  function closePopup() {
    setIsOpen(false);
    setSearch("");
  }

  return (
    <section className="aa-library">
      {/* AA 등록 */}
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

      {/* 보관함 열기 */}
      <button
        type="button"
        className="aa-library-open"
        onClick={() => setIsOpen(true)}
      >
        <span>AA 검색 및 복사</span>
        <span className="aa-library-count">
          {aas.length}개
        </span>
      </button>

      {/* 검색 팝업 */}
      {isOpen && (
        <div
          className="aa-popup-overlay"
          onClick={closePopup}
        >
          <div
            className="aa-popup"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="AA 보관함"
          >
            <div className="aa-popup-header">
              <strong>AA 보관함</strong>
              <button
                type="button"
                onClick={closePopup}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <input
              ref={searchRef}
              className="aa-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="AA 이름 검색..."
            />

            <div className="aa-popup-info">
              {loading
                ? "불러오는 중..."
                : `${filteredAAs.length}개 검색 결과`}
            </div>

            <div className="aa-popup-list">
              {!loading && filteredAAs.length === 0 ? (
                <p className="aa-empty">
                  {search
                    ? "검색 결과가 없습니다."
                    : "저장된 AA가 없습니다."}
                </p>
              ) : (
                filteredAAs.map((aa) => (
                  <div key={aa.id} className="aa-popup-item">
                    <strong className="aa-popup-name">
                      {aa.name}
                    </strong>

                    <button
                      type="button"
                      onClick={() => handleCopy(aa)}
                    >
                      복사
                    </button>

                    <button
                      type="button"
                      className="aa-popup-delete"
                      onClick={() => handleRemove(aa)}
                      aria-label={`${aa.name} 삭제`}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
