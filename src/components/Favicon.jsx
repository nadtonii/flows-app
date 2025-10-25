import { useEffect } from 'react';

const SVG_FAVICON = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <rect width="120" height="120" rx="24" fill="#FFFFFF"/>
  <rect x="24" y="22" width="52" height="76" rx="16" fill="#1F2329"/>
  <rect x="44" y="42" width="52" height="76" rx="16" fill="#C4C7CB"/>
  <rect x="56" y="72" width="28" height="8" rx="4" fill="#1F2329"/>
  <rect x="66" y="62" width="8" height="28" rx="4" fill="#1F2329"/>
</svg>`;

const DATA_URL = `data:image/svg+xml,${encodeURIComponent(SVG_FAVICON)}`;

export default function Favicon() {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const existingLink = document.querySelector('link[rel="icon"]');
    const linkElement = existingLink ?? document.createElement('link');
    const previousHref = existingLink?.getAttribute('href') ?? null;

    linkElement.setAttribute('rel', 'icon');
    linkElement.setAttribute('type', 'image/svg+xml');
    linkElement.setAttribute('href', DATA_URL);

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
  }, []);

  return null;
}
