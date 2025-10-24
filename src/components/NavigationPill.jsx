/**
 * Code exported from Paper
 * https://app.paper.design/file/01K8C2AWB4W9CQNM1MJTEDT33R?node=01K8C84F34SXBB7YJMZERS94F9
 * on Oct 25, 2025 at 1:36 AM.
 */
import { useCallback, useMemo, useState } from 'react';

export default function NavigationPill({ onAddCard }) {
  const [isCardHovered, setIsCardHovered] = useState(false);

  const handleCardActivate = useCallback(() => {
    if (typeof onAddCard === 'function') {
      onAddCard();
    }
  }, [onAddCard]);

  const handleCardKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleCardActivate();
      }
    },
    [handleCardActivate]
  );

  const cardIconStyle = useMemo(
    () => ({
      backgroundImage:
        'url("https://workers.paper.design/file-assets/01K8C2AWB4W9CQNM1MJTEDT33R/01K8C8HRCA81Y5HJJ54VC4M3Z6.svg")',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      boxSizing: 'border-box',
      flexShrink: '0',
      height: '30px',
      maxHeight: 'none',
      maxWidth: 'none',
      position: 'relative',
      transformOrigin: '50% 50%',
      width: '30px',
      cursor: 'pointer',
      transition: 'filter 150ms ease, opacity 150ms ease',
      filter: isCardHovered ? 'brightness(0.75)' : 'none',
    }),
    [isCardHovered]
  );

  return (
    <div
      style={{
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 'calc(infinity * 1px)',
        boxShadow: '#0000000D 0px 2px 20px',
        boxSizing: 'border-box',
        contain: 'layout',
        display: 'flex',
        flexDirection: 'row',
        gap: '32px',
        height: 'fit-content',
        justifyContent: 'center',
        overflowWrap: 'break-word',
        paddingBlock: '16px',
        paddingInline: '24px',
        transformOrigin: '0% 0%',
        width: 'fit-content',
      }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="Add card"
        onClick={handleCardActivate}
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => setIsCardHovered(false)}
        onFocus={() => setIsCardHovered(true)}
        onBlur={() => setIsCardHovered(false)}
        onKeyDown={handleCardKeyDown}
        style={cardIconStyle}
      />
      <div
        style={{
          backgroundImage:
            'url("https://workers.paper.design/file-assets/01K8C2AWB4W9CQNM1MJTEDT33R/01K8C8GC6N349SHHS0KRHFCXS2.svg")',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          boxSizing: 'border-box',
          flexShrink: '0',
          height: '30px',
          maxHeight: 'none',
          maxWidth: 'none',
          position: 'relative',
          transformOrigin: '50% 50%',
          width: '30px',
        }}
      />
    </div>
  );
}
