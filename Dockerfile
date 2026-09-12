# Build
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Next collects page data at build time; skip DB-backed prerendering.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Run
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle ./drizzle

# User uploads live on a volume, not in the image.
RUN mkdir -p /app/uploads && chown -R app:app /app/uploads
USER app

EXPOSE 3000
CMD ["npm", "run", "start"]
