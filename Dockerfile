FROM node:22-alpine AS build
WORKDIR /app
ARG COMMIT=dev
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN sed -i "s/export const COMMIT = \".*\";/export const COMMIT = \"${COMMIT}\";/" src/version.ts && npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
USER node
CMD ["node", "dist/server.js"]
