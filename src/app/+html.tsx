import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// The site is published under /pasaratos/ (see `experiments.baseUrl` in app.json).
const BASE = '/pasaratos';

/**
 * The pages are pre-rendered with the default settings and light colours. When the visitor has
 * saved settings or wants dark mode, the page is drawn again from scratch instead of being
 * hydrated, since its styles would not match. Runs before the app's scripts, which are deferred.
 * The key is SETTINGS_KEY in src/settings.ts.
 */
const START_SCRIPT = `try {
  var saved = localStorage.getItem('settings');
  var theme = (saved && JSON.parse(saved).theme) || 'auto';
  var dark = theme === 'dark' || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  if (saved || dark) {
    // Expo sets this flag to true further down the page; keep it false.
    Object.defineProperty(window, '__EXPO_ROUTER_HYDRATE__', { get: function () { return false; }, set: function () {} });
    document.getElementById('root').innerHTML = '';
    if (dark) document.body.style.background = '#14161B';
  }
} catch (e) {}`;

/** Root HTML of the web build: page title, icons and theme colour. */
export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();

  return (
    <html lang="es" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Pasaratos · Pasatiempos para cada rato</title>
        <meta
          name="description"
          content="Sudoku, crucigramas, palabras, reinas y muchos más pasatiempos, con reto del día."
        />
        <meta name="theme-color" content="#4263EB" />
        <link rel="icon" type="image/png" sizes="32x32" href={`${BASE}/favicon-32.png`} />
        <link rel="icon" type="image/png" sizes="192x192" href={`${BASE}/favicon-192.png`} />
        <link rel="apple-touch-icon" href={`${BASE}/apple-touch-icon.png`} />
        <ScrollViewStyleReset />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
        <script dangerouslySetInnerHTML={{ __html: START_SCRIPT }} />
      </body>
    </html>
  );
}
