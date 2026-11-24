# syntax=docker/dockerfile:1

# The image that runs TalkToData on the home server (linux/amd64). It is built by
# GitHub Actions and only ever pulled on the server, so nothing here should assume
# build tools exist at run time.
#
# Debian slim rather than Alpine: better-sqlite3 ships a prebuilt glibc binary
# for amd64 and arm64, so `npm ci` downloads it instead of compiling. On Alpine it would
# need python, make and g++ in the image just to install.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Only the manifests, so this layer is reused until a dependency changes.
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# BUILD_STANDALONE is read by next.config.ts. No secret is needed to build:
# every env value the app uses is read per request, so none is baked in here.
ENV NEXT_TELEMETRY_DISABLED=1 \
    BUILD_STANDALONE=1
RUN npm run build

FROM node:22-bookworm-slim AS run
WORKDIR /app
# HOSTNAME must be 0.0.0.0: Docker sets it to the container id, and the
# standalone server would then listen on that one address only instead of on
# every interface the tunnel container might reach it through.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Ties the package on ghcr.io to this repository.
LABEL org.opencontainers.image.source="https://github.com/RutwikPatel13/TalkToData"
# The standalone output leaves these two folders out; the server expects them
# beside it.
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
# The commit this image was built from, so /api/health can say what is
# running. It comes last because it changes on every build: anything after it
# could never be reused from the layer cache.
ARG GIT_SHA=unknown
ENV GIT_SHA=$GIT_SHA
# This app opens connections to hosts a visitor names, so it should hold as
# little privilege as possible inside the container.
USER node
EXPOSE 3000
CMD ["node", "server.js"]
