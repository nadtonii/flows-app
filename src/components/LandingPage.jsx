import PropTypes from 'prop-types';

export default function LandingPage({ onTryItNow }) {
  return (
    <div
      style={{
        backgroundColor: '#F7F7F7',
        boxSizing: 'border-box',
        contain: 'content',
        height: '1024px',
        overflowWrap: 'break-word',
        transformOrigin: '0% 0%',
        width: '1440px',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          boxSizing: 'border-box',
          contain: 'layout',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          height: '100%',
          justifyContent: 'center',
          left: '0',
          overflowWrap: 'break-word',
          paddingBlock: 0,
          paddingInline: 0,
          position: 'fixed',
          top: '0',
          transform: 'translate(0px, 0px)',
          transformOrigin: '0% 0%',
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            boxSizing: 'border-box',
            contain: 'layout',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: '0',
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
              boxSizing: 'border-box',
              color: '#000000',
              flexShrink: '0',
              fontFamily: '"Gilda Display", system-ui, sans-serif',
              fontSize: '64px',
              fontSynthesis: 'none',
              fontWeight: 400,
              height: 'fit-content',
              lineHeight: '150%',
              MozOsxFontSmoothing: 'grayscale',
              textAlign: 'center',
              transformOrigin: '50% 50%',
              WebkitFontSmoothing: 'antialiased',
              whiteSpace: 'pre',
              width: 'fit-content',
            }}
          >
            Flows.
          </div>
          <div
            style={{
              boxSizing: 'border-box',
              color: '#000000',
              flexShrink: '0',
              fontFamily: '"Inter", system-ui, sans-serif',
              fontSize: '16px',
              fontSynthesis: 'none',
              fontWeight: 500,
              height: 'fit-content',
              letterSpacing: '-0.04em',
              lineHeight: '150%',
              MozOsxFontSmoothing: 'grayscale',
              textAlign: 'center',
              transformOrigin: '50% 50%',
              WebkitFontSmoothing: 'antialiased',
              whiteSpace: 'pre',
              width: 'fit-content',
            }}
          >
            Canvas tool optimized for designer workflows.
          </div>
        </div>
        <div
          onClick={onTryItNow}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onTryItNow();
            }
          }}
          role="button"
          tabIndex={0}
          style={{
            alignItems: 'center',
            borderRadius: 'calc(infinity * 1px)',
            boxSizing: 'border-box',
            contain: 'layout',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: '0',
            gap: 0,
            height: 'fit-content',
            justifyContent: 'center',
            outline: '1px solid #000000',
            overflowWrap: 'break-word',
            paddingBlock: '8px',
            paddingInline: '12px',
            transformOrigin: '50% 50%',
            width: '135px',
          }}
        >
          <div
            style={{
              boxSizing: 'border-box',
              color: '#000000',
              flexShrink: '0',
              fontFamily: '"Inter", system-ui, sans-serif',
              fontSize: '16px',
              fontSynthesis: 'none',
              fontWeight: 400,
              height: 'fit-content',
              letterSpacing: '-0.04em',
              lineHeight: '150%',
              MozOsxFontSmoothing: 'grayscale',
              textAlign: 'center',
              transformOrigin: '50% 50%',
              WebkitFontSmoothing: 'antialiased',
              whiteSpace: 'pre',
              width: 'fit-content',
            }}
          >
            Try it now
          </div>
        </div>
      </div>
      <div
        style={{
          alignItems: 'start',
          boxSizing: 'border-box',
          contain: 'layout',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          height: '1024px',
          justifyContent: 'end',
          left: '0',
          overflowWrap: 'break-word',
          paddingBlock: '32px',
          paddingInline: 0,
          position: 'fixed',
          top: '0',
          transform: 'translate(0px, 0px)',
          transformOrigin: '0% 0%',
          width: '100%',
        }}
      >
        <div
          style={{
            alignContent: 'end',
            alignSelf: 'stretch',
            boxSizing: 'border-box',
            color: '#797979',
            flex: '1 0 0px',
            flexBasis: '0px',
            flexGrow: '1',
            flexShrink: '0',
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: '14px',
            fontSynthesis: 'none',
            fontWeight: 500,
            height: 'auto',
            letterSpacing: '-0.04em',
            lineHeight: '150%',
            MozOsxFontSmoothing: 'grayscale',
            textAlign: 'center',
            transformOrigin: '50% 50%',
            WebkitFontSmoothing: 'antialiased',
            whiteSpace: 'pre-wrap',
            width: 'auto',
          }}
        >
          *Flows is in early alpha and features such as saving are not supported yet.
        </div>
      </div>
    </div>
  );
}

LandingPage.propTypes = {
  onTryItNow: PropTypes.func.isRequired,
};
