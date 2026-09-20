# La imagen con la que se publica Carpeta Fiscal en el VPS (docs/deployment.md).
#
# Va por partes para que la imagen final lleve solo lo necesario para ejecutar la app: ni el código
# fuente, ni las dependencias de desarrollo, ni las pruebas.
#
# Ojo con `output: 'standalone'` de next.config.ts: deja en `.next/standalone` un servidor mínimo que NO
# incluye los archivos estáticos ni `public/`. Hay que copiarlos a mano, como se hace abajo, o la app
# responde pero se ve sin estilos.

# --- 1. Dependencias ---------------------------------------------------------------------------
FROM node:24-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# --- 2. Compilación ----------------------------------------------------------------------------
FROM node:24-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js mete las variables NEXT_PUBLIC_ dentro del código al compilar, así que tienen que estar aquí.
# En Dokploy se ponen como «Build args». Las secretas NO: esas se leen al ejecutar.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN pnpm build

# --- 3. Ejecución ------------------------------------------------------------------------------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# La app no corre como root.
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
