import { useMemo } from 'react';

export default function HistoryPill({ canUndo, canRedo, onUndo, onRedo }) {
  const wrapperStyle = useMemo(
    () => ({
      position: 'fixed',
      top: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 30,
      pointerEvents: 'none',
    }),
    []
  );

  const pillStyle = useMemo(
    () => ({
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      paddingInline: 14,
      paddingBlock: 8,
      borderRadius: 9999,
      background: 'rgba(255, 255, 255, 0.9)',
      boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
      border: '1px solid rgba(15, 23, 42, 0.08)',
      pointerEvents: 'auto',
      backdropFilter: 'blur(12px)',
    }),
    []
  );

  const baseButtonStyle = useMemo(
    () => ({
      width: 36,
      height: 36,
      borderRadius: 18,
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      color: '#0F172A',
      cursor: 'pointer',
      transition: 'background 150ms ease, opacity 150ms ease, color 150ms ease',
      padding: 0,
    }),
    []
  );

  const disabledStyle = useMemo(
    () => ({
      cursor: 'default',
      opacity: 0.35,
    }),
    []
  );

  const hoverStyle = useMemo(
    () => ({
      background: 'rgba(15, 23, 42, 0.08)',
    }),
    []
  );

  const renderButton = (type) => {
    const isUndo = type === 'undo';
    const enabled = isUndo ? canUndo : canRedo;
    const onActivate = isUndo ? onUndo : onRedo;
    const label = isUndo ? 'Undo (⌘Z)' : 'Redo (⇧⌘Z)';
    const title = isUndo ? 'Undo (Ctrl/Cmd+Z)' : 'Redo (Shift+Ctrl/Cmd+Z)';

    return (
      <button
        key={type}
        type="button"
        onClick={() => {
          if (!enabled) return;
          onActivate?.();
        }}
        onMouseDown={(event) => event.preventDefault()}
        style={{
          ...baseButtonStyle,
          ...(enabled ? {} : disabledStyle),
        }}
        title={title}
        aria-label={label}
        onMouseEnter={(event) => {
          if (!enabled) return;
          Object.assign(event.currentTarget.style, hoverStyle);
        }}
        onMouseLeave={(event) => {
          Object.assign(event.currentTarget.style, {
            background: 'transparent',
          });
        }}
        onFocus={(event) => {
          if (!enabled) return;
          Object.assign(event.currentTarget.style, hoverStyle);
        }}
        onBlur={(event) => {
          Object.assign(event.currentTarget.style, {
            background: 'transparent',
          });
        }}
        disabled={!enabled}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isUndo ? (
            <>
              <path d="M7.5 7.5L3 12l4.5 4.5" />
              <path d="M4 12h11a5 5 0 0 1 0 10h-2.5" />
            </>
          ) : (
            <>
              <path d="M16.5 7.5L21 12l-4.5 4.5" />
              <path d="M20 12H9a5 5 0 0 0 0 10h2.5" />
            </>
          )}
        </svg>
      </button>
    );
  };

  return (
    <div style={wrapperStyle}>
      <div style={pillStyle}>{['undo', 'redo'].map((type) => renderButton(type))}</div>
    </div>
  );
}
