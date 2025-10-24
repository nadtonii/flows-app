import { useState } from 'react';

export default function PillNavigation({ onAddCard }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          backgroundColor: '#000000',
          borderRadius: 'calc(infinity * 1px)',
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
          style={{
            alignItems: 'center',
            boxSizing: 'border-box',
            contain: 'layout',
            display: 'flex',
            flexDirection: 'row',
            flexShrink: '0',
            gap: 0,
            height: '24px',
            justifyContent: 'center',
            overflowWrap: 'break-word',
            padding: '0px',
            paddingBottom: 0,
            paddingLeft: '0px',
            paddingRight: '0px',
            paddingTop: 0,
            transformOrigin: '50% 50%',
            width: '24px',
            position: 'relative',
          }}
        >
          <button
            type="button"
            aria-label="Add card"
            onClick={onAddCard}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
            style={{
              backgroundImage:
                'url("https://workers.paper.design/file-assets/01K8C2AWB4W9CQNM1MJTEDT33R/01K8C2XHEW37E8A12D3EP7MM62.svg")',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              boxSizing: 'border-box',
              flexShrink: '0',
              height: '24px',
              maxHeight: 'none',
              maxWidth: 'none',
              position: 'relative',
              transformOrigin: '50% 50%',
              width: '24px',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              borderRadius: '9999px',
              filter: isHovered ? 'brightness(0.6)' : 'none',
              transition: 'filter 50ms linear',
              outline: 'none',
            }}
          />
          {isHovered && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#ffffff',
                color: '#111111',
                borderRadius: '9999px',
                paddingInline: '12px',
                paddingBlock: '6px',
                fontSize: 13,
                fontWeight: 600,
                boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.16)',
                whiteSpace: 'nowrap',
              }}
            >
              Card (C)
            </div>
          )}
        </div>
        <div
          style={{
            alignItems: 'center',
            boxSizing: 'border-box',
            contain: 'layout',
            display: 'flex',
            flexDirection: 'row',
            flexShrink: '0',
            gap: 0,
            height: '24px',
            justifyContent: 'center',
            overflowWrap: 'break-word',
            paddingBlock: 0,
            paddingInline: 0,
            transformOrigin: '50% 50%',
            width: '24px',
          }}
        >
          <div
            style={{
              backgroundImage:
                'url("https://workers.paper.design/file-assets/01K8C2AWB4W9CQNM1MJTEDT33R/01K8C2TAF4MDWCYJCHWD6KXYW0.svg")',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              boxSizing: 'border-box',
              flexShrink: '0',
              height: '26px',
              maxHeight: 'none',
              maxWidth: 'none',
              position: 'relative',
              transformOrigin: '50% 50%',
              width: '26px',
            }}
          />
        </div>
        <div
          style={{
            alignItems: 'center',
            boxSizing: 'border-box',
            contain: 'layout',
            display: 'flex',
            flexDirection: 'row',
            flexShrink: '0',
            gap: 0,
            height: 'fit-content',
            justifyContent: 'start',
            overflowWrap: 'break-word',
            paddingBlock: 0,
            paddingInline: 0,
            transformOrigin: '50% 50%',
            width: 'fit-content',
          }}
        >
          <div
            style={{
              alignItems: 'center',
              boxSizing: 'border-box',
              contain: 'layout',
              display: 'flex',
              flexDirection: 'row',
              flexShrink: '0',
              gap: 0,
              height: '24px',
              justifyContent: 'center',
              overflowWrap: 'break-word',
              paddingBlock: '4px',
              paddingInline: '4px',
              transformOrigin: '50% 50%',
              width: '24px',
            }}
          >
            <div
              style={{
                backgroundImage:
                  'url("https://workers.paper.design/file-assets/01K8C2AWB4W9CQNM1MJTEDT33R/01K8C33G5F1CNHG35WG79G2VDH.svg")',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                boxSizing: 'border-box',
                flexShrink: '0',
                height: '20px',
                maxHeight: 'none',
                maxWidth: 'none',
                position: 'relative',
                transformOrigin: '50% 50%',
                width: '20px',
              }}
            />
          </div>
        </div>
        <div
          style={{
            alignItems: 'center',
            boxSizing: 'border-box',
            contain: 'layout',
            display: 'flex',
            flexDirection: 'row',
            flexShrink: '0',
            gap: 0,
            height: 'fit-content',
            justifyContent: 'start',
            overflowWrap: 'break-word',
            paddingBlock: 0,
            paddingInline: 0,
            transformOrigin: '50% 50%',
            width: 'fit-content',
          }}
        >
          <div
            style={{
              alignItems: 'center',
              boxSizing: 'border-box',
              contain: 'layout',
              display: 'flex',
              flexDirection: 'row',
              flexShrink: '0',
              gap: 0,
              height: 'fit-content',
              justifyContent: 'start',
              overflowWrap: 'break-word',
              padding: '2px 0px',
              paddingBottom: '2px',
              paddingLeft: '0px',
              paddingRight: '0px',
              paddingTop: '2px',
              transformOrigin: '50% 50%',
              width: 'fit-content',
            }}
          >
            <div
              style={{
                backgroundImage:
                  'url("https://workers.paper.design/file-assets/01K8C2AWB4W9CQNM1MJTEDT33R/01K8C34VBTVTQ9N15MXVQNX813.svg")',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                boxSizing: 'border-box',
                flexShrink: '0',
                height: '24px',
                maxHeight: 'none',
                maxWidth: 'none',
                position: 'relative',
                transformOrigin: '50% 50%',
                width: '24px',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
