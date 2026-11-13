FROM node:24.22.2-alpine@sha256:a34ab6d7f6f4813f4d0c5469d74685604b962fbdbf5793a7bc7b4998ecb867c8 AS base

RUN apk upgrade --no-cache

FROM base AS builder

# Upgrade npm — if updating the Node.js version, check if this
# is still necessary and make sure it never downgrades npm
RUN npm install -g npm@11.19.1

WORKDIR /build-stage
COPY package.json package-lock.json .npmrc ./
RUN npm ci --quiet
COPY . ./
RUN npm run compile

FROM base AS final

RUN apk add --no-cache tini \
    && rm -rf /usr/local/lib/node_modules/npm \
        /usr/local/lib/node_modules/corepack \
        /usr/local/bin/npm \
        /usr/local/bin/npx \
        /usr/local/bin/corepack \
        /opt/yarn-* \
        /usr/local/bin/yarn \
        /usr/local/bin/yarnpkg

WORKDIR /app
COPY --from=builder /build-stage/dist ./
ENV PORT=9000
EXPOSE 9000
ENTRYPOINT ["tini", "--"]
CMD ["node", "application.js"]