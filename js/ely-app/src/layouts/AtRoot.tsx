import { WithChildren } from "../HtmlNode";

export function AtRoot({ children }: WithChildren) {
  const appName = "Ely App";
  const htmxVersion = "1.9.9";
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="application-name" content={appName} />
        <link rel="stylesheet" href="/public/index.gen.css" />
        <title>{appName}</title>
      </head>
      <body>
        {children}
        <script src={`https://unpkg.com/htmx.org@${htmxVersion}`}></script>
      </body>
    </html>
  );
}
