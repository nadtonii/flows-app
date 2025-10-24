import Frame from './TextFormattingFrame.jsx';
import '../styles/textFormattingToolbar.css';

const BUTTON_ORDER = ['italic', 'bold', 'underline', 'strikethrough'];

export default function TextFormattingToolbar({
  formatting,
  onToggle,
  position,
  visible,
}) {
  if (!visible || !position) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        transform: 'translate(-50%, -100%)',
        marginTop: -16,
        zIndex: 40,
        pointerEvents: 'none',
      }}
    >
      <div className="text-toolbar-frame" style={{ position: 'relative', pointerEvents: 'auto' }}>
        <Frame />
        <div className="text-toolbar-actions">
          {BUTTON_ORDER.map((format) => (
            <button
              key={format}
              type="button"
              className="text-toolbar-button"
              data-format={format}
              data-active={formatting?.[format] ? 'true' : 'false'}
              aria-pressed={formatting?.[format] ? 'true' : 'false'}
              onClick={() => onToggle(format)}
              title={format.charAt(0).toUpperCase() + format.slice(1)}
            />
          ))}
          <div className="text-toolbar-terminal" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
