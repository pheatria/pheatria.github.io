# AA 입력 도우미 (React 버전)

기존 `AA 입력 도우미.html` 한 파일을 Vite + React 프로젝트로 옮긴 것입니다.
기능은 원본과 동일하고, 연습하기 좋게 파일을 쪼개 두었습니다.

## 실행

Node.js(18 이상)가 필요합니다.

```bash
npm install
npm run dev       # http://localhost:5173 에서 확인, 저장하면 자동 새로고침
npm run build     # dist/ 폴더에 배포용 결과물 생성
```

폰에서 확인하려면 `npm run dev -- --host` 후 터미널에 나온 Network 주소로 접속하세요.

## 폴더 구조

```
src/
  main.jsx                  진입점 (App을 #root에 그림)
  App.jsx                   전체 state와 동작 로직 ← 가장 먼저 읽을 파일
  App.css                   스타일 (원본 CSS 그대로)
  components/
    Editor.jsx              AA 입력 textarea
    SnippetBar.jsx          기호 버튼 줄
    FontSizeControl.jsx     A− / A＋
    SnippetSettings.jsx     "버튼 편집" 영역
  hooks/
    useLocalStorage.js      useState + localStorage 자동 저장
    useMessage.js           "복사했어요" 같은 잠깐 뜨는 문구
  assets/fonts/Monapo.woff2 원본에 base64로 박혀 있던 폰트(1.4MB)를 파일로 분리
```

## 원본 → React 대응표

| 원본 (바닐라 JS) | React 버전 |
|---|---|
| `document.getElementById` | `useRef` |
| `ed.value = ...` 직접 수정 | `useState`의 `draft` + `value={draft}` |
| `load()` / `store()` | `useLocalStorage` 훅 |
| `render()`가 버튼을 직접 만듦 | `snippets.map(...)` 으로 JSX 반환 |
| `say()` + `setTimeout` | `useMessage` 훅 |
| `ed.setRangeText(...)` | 문자열을 잘라 `setDraft` + `useLayoutEffect`로 커서 복원 |

localStorage key(`draft`, `snips`, `fs`)가 원본과 같아서, 같은 주소에서 열면 저장된 글/버튼이 이어집니다.
(`file://`로 열던 원본과 `localhost`는 브라우저가 저장소를 따로 취급하니 처음엔 비어 있을 수 있어요.)

## 연습 과제 (쉬운 것부터)

1. **쉬움** — `DEFAULT_SNIPPETS`에 버튼을 몇 개 더 추가해 보기.
2. **쉬움** — 글자 수 표시 추가: `<small>{draft.length}자</small>`. state가 바뀌면 화면이 자동으로 바뀌는 걸 체감하기.
3. **보통** — `FontSizeControl`에서 최소/최대에 도달하면 해당 버튼 `disabled` 처리하기 (props로 min, max 내려주기).
4. **보통** — 다크/라이트 수동 전환 버튼. CSS에 이미 `[data-theme]` 규칙이 있으니 `document.documentElement.dataset.theme`만 바꾸면 됩니다. `useEffect` 연습용.
5. **보통** — "전각×7"의 7을 설정 가능하게 만들기 (새 state + localStorage).
6. **어려움** — 되돌리기(Undo): 마지막 삽입 전 상태를 배열 state로 쌓아 두기. 브라우저 기본 Ctrl+Z가 버튼 삽입에는 안 먹는 이유도 같이 찾아보기.
7. **어려움** — 여러 개의 초안 탭 (draft를 `{id, title, text}[]` 로 바꾸기). state 구조 설계 연습.
8. **도전** — TypeScript로 바꾸기 (`.jsx` → `.tsx`, props에 타입 붙이기).

## 알아두면 좋은 점

- `insert()`에서 `nextCursor` ref와 `useLayoutEffect`를 쓰는 이유: textarea 값을 React가 바꾸면 커서가 맨 끝으로 튀기 때문에, 렌더 직후 커서를 직접 복원해야 합니다. 이 프로젝트에서 가장 "React답지 않게 까다로운" 부분이라 한 번 주석 읽어 볼 만합니다.
- 버튼의 `onPointerDown={e => e.preventDefault()}`는 모바일에서 버튼을 눌러도 키보드가 닫히지 않게 하려는 것입니다. 지워 보고 폰에서 어떻게 달라지는지 확인해 보세요.
- `StrictMode`에서는 개발 중 effect가 두 번 실행될 수 있습니다. 정상이며 배포 빌드에서는 한 번만 실행됩니다.
