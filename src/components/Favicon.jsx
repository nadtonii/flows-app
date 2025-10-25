import { useEffect, useMemo } from 'react';
import ReactDOMServer from 'react-dom/server';

function FaviconGraphic() {
  return (
    <div
      xmlns="http://www.w3.org/1999/xhtml"
      style={{
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxSizing: 'border-box',
        contain: 'layout',
        display: 'flex',
        flexDirection: 'row',
        gap: 0,
        height: 'fit-content',
        justifyContent: 'center',
        overflowWrap: 'break-word',
        paddingBlock: '12px',
        paddingInline: '12px',
        transformOrigin: '0% 0%',
        width: 'fit-content',
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
    </div>
  );
}

export default function Favicon() {
  const dataUrl = useMemo(() => {
    const markup = ReactDOMServer.renderToStaticMarkup(<FaviconGraphic />);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">\n  <foreignObject width="120" height="120">${markup}</foreignObject>\n</svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const existingLink = document.querySelector('link[rel="icon"]');
    const linkElement = existingLink ?? document.createElement('link');
    const previousHref = existingLink?.getAttribute('href') ?? null;

    linkElement.setAttribute('rel', 'icon');
    linkElement.setAttribute('type', 'image/svg+xml');
    linkElement.setAttribute('href', dataUrl);

    if (!existingLink) {
      document.head.appendChild(linkElement);
    }

    return () => {
      if (existingLink) {
        if (previousHref) {
          linkElement.setAttribute('href', previousHref);
        }
      } else {
        document.head.removeChild(linkElement);
      }
    };
  }, [dataUrl]);

  return null;
}
