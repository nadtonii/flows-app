import { useId, useState } from 'react';
import Frame from './Frame.jsx';
import '../styles/pillNavigation.css';

export default function PillNavigation({ onAddCard }) {
  const tooltipId = useId();
  const [isActive, setIsActive] = useState(false);

  const showTooltip = isActive;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <div className="pill-navigation-frame" style={{ position: 'relative', pointerEvents: 'auto' }}>
        <Frame />
        <button
          type="button"
          aria-label="Add card"
          aria-describedby={showTooltip ? tooltipId : undefined}
          onClick={onAddCard}
          onMouseEnter={() => setIsActive(true)}
          onMouseLeave={() => setIsActive(false)}
          onFocus={() => setIsActive(true)}
          onBlur={() => setIsActive(false)}
          style={{
            position: 'absolute',
            top: 28,
            left: 28,
            width: 40,
            height: 40,
            borderRadius: 9999,
            border: 'none',
            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
            cursor: 'pointer',
            padding: 0,
            outline: 'none',
            boxShadow: isActive ? '0 0 0 2px rgba(255, 255, 255, 0.35)' : 'none',
            transition: 'background-color 150ms ease, box-shadow 150ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {showTooltip && (
          <div
            id={tooltipId}
            role="tooltip"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: 28,
              transform: 'translateX(-50%)',
              backgroundColor: '#ffffff',
              color: '#111111',
              borderRadius: 9999,
              paddingInline: 12,
              paddingBlock: 6,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.16)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            Card (C)
          </div>
        )}
      </div>
    </div>
  );
}
