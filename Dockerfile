# ---------- Etapa 1: compilación ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm config set fetch-retries 5 && npm config set fetch-retry-maxtimeout 120000 && npm ci --no-audit --no-fund
COPY . .
RUN npm test && npm run build

# ---------- Etapa 2: servidor web ----------
FROM nginx:1.27-alpine
LABEL org.opencontainers.image.source="https://github.com/Jandry20145/pediacalc-ec" \
      org.opencontainers.image.description="PediaCalc EC: calculadora pediátrica PWA offline (MSP Ecuador)"
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
