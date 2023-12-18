FROM denoland/deno:alpine-v1.23.0

WORKDIR /app

USER deno
COPY deps.ts .
RUN deno cache deps.ts
ADD . .
RUN deno cache main.ts

EXPOSE 8000

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "main.ts"]
