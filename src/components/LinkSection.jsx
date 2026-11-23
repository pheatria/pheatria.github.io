
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

async function updateAA(aa) {
  const db = await dbPromise;
  return db.put(STORE_NAME, aa);
}

export default function LinkSection({ say }) {
  const [aas, setAas] = useState([]);
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingAA, setEditingAA] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const searchRef = useRef(null);
  const importFileRef = useRef(null);

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
  
    try {
      if (editingAA) {
        // 기존 AA 수정
        await updateAA({
          ...editingAA,
          name,
          content: text,
          updatedAt: Date.now(),
        });
  
        say?.("AA를 수정했습니다.");
      } else {
        // 신규 AA 등록
        await addAA({
          id: crypto.randomUUID(),
          name,
          content: text,
          createdAt: Date.now(),
        });
  
        say?.("AA를 저장했습니다.");
      }
  
      setLabel("");
      setContent("");
      setEditingAA(null);
      setIsRegisterOpen(false);
  
      await loadAAs();
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

  // AA 수정 팝업 열기
  function handleUpdate(aa) {
    setEditingAA(aa);
    setLabel(aa.name);
    setContent(aa.content);
    setIsRegisterOpen(true);
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

  //JSON 백업
  async function handleExport() {
    try {
      const data = await getAllAAs();
  
      const backup = {
        format: "aa-library",
        version: 1,
        exportedAt: new Date().toISOString(),
        aas: data,
      };
  
      const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
      );
  
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
  
      link.href = url;
      link.download = `aa-library-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
  
      link.click();
  
      URL.revokeObjectURL(url);
  
      say?.(`${data.length}개의 AA를 백업했습니다.`);
    } catch (error) {
      console.error("AA 백업 실패:", error);
      say?.("AA 백업에 실패했습니다.");
    }
  }

  // JSON 복원
  async function handleImport(e) {
    const file = e.target.files?.[0];
  
    if (!file) return;
  
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
  
      if (
        backup.format !== "aa-library" ||
        backup.version !== 1 ||
        !Array.isArray(backup.aas)
      ) {
        throw new Error("올바른 AA 백업 파일이 아닙니다.");
      }
  
      const validAAs = backup.aas.filter(
        (aa) =>
          aa &&
          typeof aa.id === "string" &&
          typeof aa.name === "string" &&
          typeof aa.content === "string" &&
          typeof aa.createdAt === "number" &&
          aa.name.trim().length > 0
      );
  
      if (validAAs.length !== backup.aas.length) {
        throw new Error("백업 파일에 잘못된 데이터가 포함되어 있습니다.");
      }
  
      if (validAAs.length === 0) {
        say?.("복원할 AA가 없습니다.");
        return;
      }
  
      const confirmed = confirm(
        `${validAAs.length}개의 AA를 복원할까요?\n\n기존 데이터는 삭제되지 않습니다.`
      );
  
      if (!confirmed) return;
  
      const db = await dbPromise;
      const tx = db.transaction(STORE_NAME, "readwrite");
  
      const existingIds = new Set(
        await tx.store.getAllKeys()
      );
  
      let imported = 0;
      let skipped = 0;
  
      for (const aa of validAAs) {
        if (existingIds.has(aa.id)) {
          skipped++;
          continue;
        }
  
        await tx.store.add(aa);
        imported++;
      }
  
      await tx.done;
  
      await loadAAs();
  
      say?.(
        `복원 완료: ${imported}개 추가, ${skipped}개 중복 제외`
      );
    } catch (error) {
      console.error("AA 복원 실패:", error);
      say?.("AA 복원에 실패했습니다.");
    } finally {
      e.target.value = "";
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

    // 팝업 닫기
  function closeRegisterPopup() {
    setIsRegisterOpen(false);
  }

  return (
    <section className="aa-library">
      {/* AA 등록 */}
      {/* <form className="link-form" onSubmit={handleAdd}>
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
      </form> */}

      {/* 보관함 열기 */}
      <div className="aa-library-actions">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
        >
          AA 검색 및 복사 ({aas.length})
        </button>
      
        <button
          type="button"
          onClick={() => {
            setEditingAA(null);
            setLabel("");
            setContent("");
            setIsRegisterOpen(true);
          }}
        >
          ＋ AA 등록
        </button>
      </div>

      {isRegisterOpen && (
        <div
          className="aa-popup-overlay"
          onClick={closeRegisterPopup}
        >
          <div
            className="aa-popup"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="AA 등록"
          >
            <div className="aa-popup-header">
              <strong>{editingAA ? "AA 수정" : "AA 등록"}</strong>
              <button
                type="button"
                onClick={closeRegisterPopup}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
      
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
                rows={10}
                spellCheck={false}
              />
      
              <button type="submit" className="primary">
                {editingAA ? "수정 완료" : "＋ AA 저장"}
              </button>
            </form>
          </div>
        </div>
      )}

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
                      onClick={() => handleUpdate(aa)}
                    >
                      수정
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
            <div className="aa-backup-actions">
                <button type="button" onClick={handleExport}>
                  ↓ JSON 백업
                </button>
              
                <button
                  type="button"
                  onClick={() => importFileRef.current?.click()}
                >
                  ↑ JSON 복원
                </button>
              
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".json,application/json"
                  hidden
                  onChange={handleImport}
                />
              </div>
          </div>
        </div>
      )}
    </section>
  );
}
