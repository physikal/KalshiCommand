FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
RUN mkdir -p /data
ENV HOST=0.0.0.0
ENV PORT=4321
ENV DB_PATH=/data/kalshi.db
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
