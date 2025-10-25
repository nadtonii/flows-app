import NavigationPill from './NavigationPill.jsx';

export default function PillNavigation({ onAddCard, onAddArrow }) {
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
      <div style={{ pointerEvents: 'auto' }}>
        <NavigationPill onAddCard={onAddCard} onAddArrow={onAddArrow} />
      </div>
    </div>
  );
}
