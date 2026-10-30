import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// The site is published under /pasaratos/ (see `experiments.baseUrl` in app.json).
const BASE = '/pasaratos';

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
      </body>
    </html>
  );
}
