import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";

const app = new Elysia()
  .use(html())
  .use(staticPlugin())
  .get("/", () => {})
  .listen(3000, (server) => {
    console.log(`🦊 Elysia is running at ${server.hostname}:${server.port}`);
  });
