# Build stage
FROM debian:stable-slim AS build-stage

ARG BUILD_DATE
ARG VERSION
ARG TEEMII_VERSION

LABEL build_version="dokkaner.io version:- ${VERSION} Build-date:- ${BUILD_DATE}"
LABEL maintainer="dokkaner"
ENV NODE_VERSION=node_20.x
ENV NODE_KEYRING=/usr/share/keyrings/nodesource.gpg
ENV DISTRIBUTION=bookworm

# Install Node.js
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Add Node.js repository
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | gpg --dearmor | tee "$NODE_KEYRING" >/dev/null && \
    echo "deb [signed-by=$NODE_KEYRING] https://deb.nodesource.com/$NODE_VERSION $DISTRIBUTION main" | tee /etc/apt/sources.list.d/nodesource.list

# Install dependencies
RUN apt-get update && \
   DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
    nodejs  && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
    mkdir -p /root/db

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm install pm2 -g

# Copy all files
COPY . .

# Expose ports
EXPOSE 3000

USER $user

# Launch server
CMD ["pm2-runtime", "start", "./src/app.js"]