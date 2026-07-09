import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveCss = `
  html, body, #root { height: 100%; max-width: 100vw; overflow-x: hidden; }
  body { margin: 0; -webkit-font-smoothing: antialiased; overflow: hidden; }
  #root { display: flex; flex-direction: column; overflow: hidden; }
  * { box-sizing: border-box; }
`;
