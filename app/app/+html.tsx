import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Font display: block prevents FOUT (Flash of Unstyled Text) */}
        <style dangerouslySetInnerHTML={{ __html: fontStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #FFFDF9;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #FFFDF9;
  }
}

/* Note: React Native Reanimated animations are JavaScript-driven, not CSS */`;

const fontStyles = `
/* Hide all content until fonts are loaded to prevent FOUT */
body:not(.fonts-loaded) {
  visibility: hidden !important;
}
body:not(.fonts-loaded)::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #FFFDF9;
  z-index: 9999;
  visibility: visible !important;
}
body.fonts-loaded {
  visibility: visible !important;
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 
 * Fix for dynamic content font pop-in:
 * Apply a subtle fade-in animation to all new elements.
 * This smooths out any remaining font rendering jitter when
 * new components mount after data fetches.
 */
body.fonts-loaded [data-testid],
body.fonts-loaded [role="button"],
body.fonts-loaded [class*="card"],
body.fonts-loaded [class*="Card"] {
  animation: contentFadeIn 0.15s ease-out;
}

@keyframes contentFadeIn {
  from { opacity: 0.85; }
  to { opacity: 1; }
}
`;
