FROM node:20-alpine as base
RUN npm i -g pnpm

FROM base as deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

FROM base as build
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm build
RUN pnpm prune --prod

FROM nginx as deploy
WORKDIR /app
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/node_modules ./node_modules
