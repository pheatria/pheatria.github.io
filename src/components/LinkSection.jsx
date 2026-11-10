import { useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage";

// 코드에 박아둔 기본 링크. 저장소가 지워져도 이건 돌아옵니다.
const DEFAULT_LINKS = [
  { id: "aahub", label: "AAHub", url: "https://여기에-주소" },
  { id: "yaruyomi", label: "야루요미", url: "https://여기에-주소" },
];

function parseLinks(raw) {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return []; // 저장된 값이 깨졌을 때
  }
}

export default function LinkSection({ say }) {
  const [raw, setRaw] = useLocalStorage("links", JSON.stringify(DEFAULT_LINKS));
  const [label, setLabel] = useState(""); // 이름 입력칸
  const [url, setUrl] = useState("");     // 주소 입력칸

  const links = parseLinks(raw);
  const save = (next) => setRaw(JSON.stringify(next));

  function handleAdd(e) {
    e.preventDefault(); // form 기본 동작(페이지 새로고침) 막기
    const name = label.trim();
    let address = url.trim();
    if (!name || !address) {
      say("이름과 주소를 모두 입력하세요");
      return;
    }
    if (!/^https?:\/\//i.test(address)) address = "https://" + address;
    try {
      new URL(address); // 형식이 틀리면 에러
    } catch {
      say("주소 형식이 올바르지 않아요");
      return;
    }
    save([...links, { id: crypto.randomUUID(), label: name, url: address }]);
    setLabel("");
    setUrl("");
  }

  function handleRemove(id) {
    if (confirm("이 링크를 지울까요?")) save(links.filter((l) => l.id !== id));
  }

  return (
    <section>
      <form className="link-form" onSubmit={handleAdd}>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="버튼 이름 (예: 야루요미)"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="주소 (https://...)"
          inputMode="url"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button type="submit" className="primary">＋ 링크 추가</button>
      </form>

      <ul className="link-list">
        {links.map((l) => (
          <li key={l.id}>
            <a className="link-button" href={l.url} target="_blank" rel="noopener noreferrer">
              {l.label}
            </a>
            <button onClick={() => handleRemove(l.id)} aria-label={`${l.label} 삭제`}>✕</button>
          </li>
        ))}
      </ul>
    </section>
  );
}