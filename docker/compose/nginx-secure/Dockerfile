FROM nginx:alpine
RUN apk update && apk upgrade --no-cache \
    libcrypto3 libssl3 \
    libpng \
    musl musl-utils \
    zlib \
    libuuid && \
    rm -rf /var/cache/apk/*
COPY gateway.conf /etc/nginx/conf.d/default.conf
