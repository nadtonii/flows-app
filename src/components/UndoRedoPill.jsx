function UndoIcon({ disabled }) {
  const stroke = disabled ? '#94A3B8' : '#1C274C';
  const fillPrimary = disabled ? '#94A3B8' : '#1C274C';
  const fillSecondary = disabled ? 'rgba(148, 163, 184, 0.7)' : '#1C274C';

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <g strokeWidth="0" />
      <g strokeLinecap="round" strokeLinejoin="round" />
      <g>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.53033 3.46967C7.23744 3.17678 6.76256 3.17678 6.46967 3.46967L3.46967 6.46967C3.17678 6.76256 3.17678 7.23744 3.46967 7.53033L6.46967 10.5303C6.76256 10.8232 7.23744 10.8232 7.53033 10.5303C7.82322 10.2374 7.82322 9.76256 7.53033 9.46967L5.06066 7L7.53033 4.53033C7.82322 4.23744 7.82322 3.76256 7.53033 3.46967Z"
          fill={fillPrimary}
        />
        <path
          opacity="0.5"
          d="M5.81066 6.25H15C18.1756 6.25 20.75 8.82436 20.75 12C20.75 15.1756 18.1756 17.75 15 17.75H8C7.58579 17.75 7.25 17.4142 7.25 17C7.25 16.5858 7.58579 16.25 8 16.25H15C17.3472 16.25 19.25 14.3472 19.25 12C19.25 9.65279 17.3472 7.75 15 7.75H5.81066L5.06066 7L5.81066 6.25Z"
          fill={fillSecondary}
        />
        <path stroke={stroke} strokeWidth="0.768" d="M0 0" />
      </g>
    </svg>
  );
}

function RedoIcon({ disabled }) {
  const stroke = disabled ? '#94A3B8' : '#1C274C';
  const fillPrimary = disabled ? '#94A3B8' : '#1C274C';
  const fillSecondary = disabled ? 'rgba(148, 163, 184, 0.7)' : '#1C274C';

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <g strokeWidth="0" />
      <g strokeLinecap="round" strokeLinejoin="round" />
      <g>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M16.4697 3.46967C16.7626 3.17678 17.2374 3.17678 17.5303 3.46967L20.5303 6.46967C20.8232 6.76256 20.8232 7.23744 20.5303 7.53033L17.5303 10.5303C17.2374 10.8232 16.7626 10.8232 16.4697 10.5303C16.1768 10.2374 16.1768 9.76256 16.4697 9.46967L18.9393 7L16.4697 4.53033C16.1768 4.23744 16.1768 3.76256 16.4697 3.46967Z"
          fill={fillPrimary}
        />
        <path
          opacity="0.5"
          d="M18.1893 6.25H9.00001C5.82437 6.25 3.25 8.82436 3.25 12C3.25 15.1756 5.82436 17.75 9 17.75H16C16.4142 17.75 16.75 17.4142 16.75 17C16.75 16.5858 16.4142 16.25 16 16.25H9C6.65279 16.25 4.75 14.3472 4.75 12C4.75 9.65279 6.6528 7.75 9.00001 7.75H18.1893L18.9393 7L18.1893 6.25Z"
          fill={fillSecondary}
        />
        <path stroke={stroke} strokeWidth="0.768" d="M0 0" />
      </g>
    </svg>
  );
}

export default function UndoRedoPill({
  canUndo = false,
  canRedo = false,
  onUndo = () => {},
  onRedo = () => {},
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'rgba(255, 255, 255, 0.92)',
          borderRadius: 9999,
          border: '1px solid rgba(15, 23, 42, 0.08)',
          padding: '8px 14px',
        }}
      >
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo (⌘Z)"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '9999px',
            border: 'none',
            background: 'transparent',
            cursor: canUndo ? 'pointer' : 'not-allowed',
            transition: 'background-color 150ms ease, opacity 150ms ease',
            padding: 0,
            opacity: canUndo ? 1 : 0.45,
          }}
          onMouseDown={(event) => event.preventDefault()}
        >
          <UndoIcon disabled={!canUndo} />
        </button>
        <div
          style={{
            width: 1,
            height: 20,
            background: 'rgba(148, 163, 184, 0.35)',
          }}
        />
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo (⇧⌘Z)"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '9999px',
            border: 'none',
            background: 'transparent',
            cursor: canRedo ? 'pointer' : 'not-allowed',
            transition: 'background-color 150ms ease, opacity 150ms ease',
            padding: 0,
            opacity: canRedo ? 1 : 0.45,
          }}
          onMouseDown={(event) => event.preventDefault()}
        >
          <RedoIcon disabled={!canRedo} />
        </button>
      </div>
    </div>
  );
}

