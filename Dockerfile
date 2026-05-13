FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci --force

FROM base AS development

COPY . .

EXPOSE 3002

CMD ["npm", "run", "dev"]

FROM base AS production-build

COPY . .
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=production-build /app/package*.json ./
COPY --from=production-build /app/node_modules ./node_modules
COPY --from=production-build /app/.next ./.next
COPY --from=production-build /app/public ./public

EXPOSE 3002

CMD ["npm", "run", "start"]
