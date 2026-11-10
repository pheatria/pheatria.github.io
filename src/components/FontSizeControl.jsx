export default function FontSizeControl({ fontSize, onChange }) {
  return (
    <div className="row">
      <button onClick={() => onChange(fontSize - 1)}>A−</button>
      <button onClick={() => onChange(fontSize + 1)}>A＋</button>
      <small>글자 {fontSize}px</small>
    </div>
  );
}
