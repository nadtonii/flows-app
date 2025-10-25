import PropTypes from 'prop-types';

export default function OnboardingOverlay({ onExplore, visibility }) {
  const visibilityClass =
    visibility === 'visible'
      ? 'onboarding-overlay--visible'
      : visibility === 'hiding'
      ? 'onboarding-overlay--hiding'
      : '';

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onExplore();
    }
  };

  return (
    <div className={`onboarding-overlay ${visibilityClass}`}>
      <div
        style={{
          alignItems: 'center',
          backgroundColor: '#F7F7F7',
          borderRadius: '24px',
          boxSizing: 'border-box',
          contain: 'layout',
          display: 'flex',
          flexDirection: 'column',
          gap: '64px',
          height: 'fit-content',
          justifyContent: 'start',
          outline: '1px solid #00000014',
          overflowWrap: 'break-word',
          padding: '64px 128px 46px',
          paddingBottom: '46px',
          paddingLeft: '128px',
          paddingRight: '128px',
          paddingTop: '64px',
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
              fontSize: '48px',
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
            Welcome to Flows.
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
              whiteSpace: 'pre-wrap',
              width: '516px',
            }}
          >
            Thank you for testing Flows early. This helps us shape the product together
            with you.
          </div>
        </div>
        <div
          style={{
            alignItems: 'center',
            boxSizing: 'border-box',
            contain: 'layout',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: '0',
            gap: '16px',
            height: 'fit-content',
            justifyContent: 'start',
            overflowWrap: 'break-word',
            paddingBlock: 0,
            paddingInline: 0,
            transformOrigin: '50% 50%',
            width: '466.102px',
          }}
        >
          <div
            style={{
              alignItems: 'center',
              alignSelf: 'stretch',
              boxSizing: 'border-box',
              contain: 'layout',
              display: 'flex',
              flexDirection: 'row',
              flexShrink: '0',
              gap: '64px',
              height: 'fit-content',
              justifyContent: 'center',
              overflowWrap: 'break-word',
              paddingBlock: 0,
              paddingInline: 0,
              transformOrigin: '50% 50%',
              width: 'auto',
            }}
          >
            <div
              style={{
                alignItems: 'center',
                boxSizing: 'border-box',
                contain: 'layout',
                display: 'flex',
                flex: '1 0 0px',
                flexBasis: '0px',
                flexDirection: 'column',
                flexGrow: '1',
                flexShrink: '0',
                gap: '8px',
                height: 'fit-content',
                justifyContent: 'center',
                overflowWrap: 'break-word',
                paddingBlock: 0,
                paddingInline: 0,
                transformOrigin: '50% 50%',
                width: 'auto',
              }}
            >
              <div
                style={{
                  backgroundImage:
                    'url("https://workers.paper.design/file-assets/01K8C2AWB4W9CQNM1MJTEDT33R/01K8C8HRCA81Y5HJJ54VC4M3Z6.svg")',
                  backgroundPosition: 'center center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'cover',
                  boxSizing: 'border-box',
                  flexShrink: '0',
                  height: '96px',
                  maxHeight: 'none',
                  maxWidth: 'none',
                  position: 'relative',
                  transformOrigin: '50% 50%',
                  width: '96px',
                }}
              />
              <div
                style={{
                  boxSizing: 'border-box',
                  color: '#000000',
                  flexShrink: '0',
                  fontFamily: '"Inter", system-ui, sans-serif',
                  fontSize: '14px',
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
                Create cards
              </div>
            </div>
            <div
              style={{
                alignItems: 'center',
                boxSizing: 'border-box',
                contain: 'layout',
                display: 'flex',
                flex: '1 0 0px',
                flexBasis: '0px',
                flexDirection: 'column',
                flexGrow: '1',
                flexShrink: '0',
                gap: '8px',
                height: 'fit-content',
                justifyContent: 'start',
                overflowWrap: 'break-word',
                paddingBlock: 0,
                paddingInline: 0,
                transformOrigin: '50% 50%',
                width: 'auto',
              }}
            >
              <div
                style={{
                  backgroundImage:
                    'url("https://workers.paper.design/file-assets/01K8C2AWB4W9CQNM1MJTEDT33R/01K8DP86B23KSAJK8YBW7HZCW4.svg")',
                  backgroundPosition: 'center center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'cover',
                  boxSizing: 'border-box',
                  flexShrink: '0',
                  height: '96px',
                  maxHeight: 'none',
                  maxWidth: 'none',
                  position: 'relative',
                  transformOrigin: '50% 50%',
                  width: '96px',
                }}
              />
              <div
                style={{
                  boxSizing: 'border-box',
                  color: '#000000',
                  flexShrink: '0',
                  fontFamily: '"Inter", system-ui, sans-serif',
                  fontSize: '14px',
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
                Customize colors
              </div>
            </div>
            <div
              style={{
                alignItems: 'center',
                boxSizing: 'border-box',
                contain: 'layout',
                display: 'flex',
                flex: '1 0 0px',
                flexBasis: '0px',
                flexDirection: 'column',
                flexGrow: '1',
                flexShrink: '0',
                gap: '8px',
                height: 'fit-content',
                justifyContent: 'center',
                overflowWrap: 'break-word',
                paddingBlock: 0,
                paddingInline: 0,
                transformOrigin: '50% 50%',
                width: 'auto',
              }}
            >
              <div
                style={{
                  backgroundImage:
                    'url("https://workers.paper.design/file-assets/01K8C2AWB4W9CQNM1MJTEDT33R/01K8C8GC6N349SHHS0KRHFCXS2.svg")',
                  backgroundPosition: 'center center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'cover',
                  boxSizing: 'border-box',
                  flexShrink: '0',
                  height: '96px',
                  maxHeight: 'none',
                  maxWidth: 'none',
                  position: 'relative',
                  transformOrigin: '50% 50%',
                  width: '96px',
                }}
              />
              <div
                style={{
                  boxSizing: 'border-box',
                  color: '#000000',
                  flexShrink: '0',
                  fontFamily: '"Inter", system-ui, sans-serif',
                  fontSize: '14px',
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
                Connect the cards
              </div>
            </div>
          </div>
        </div>
        <div
          onClick={onExplore}
          onKeyDown={handleKeyDown}
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
            Explore
          </div>
        </div>
      </div>
    </div>
  );
}

OnboardingOverlay.propTypes = {
  onExplore: PropTypes.func.isRequired,
  visibility: PropTypes.oneOf(['hidden', 'visible', 'hiding']).isRequired,
};
