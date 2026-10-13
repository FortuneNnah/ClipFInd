FROM node:20-slim

# System deps: python3 + pip (yt-dlp), ffmpeg, curl (Deno install)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip ffmpeg curl ca-certificates unzip \
 && rm -rf /var/lib/apt/lists/*

# Deno: JS runtime yt-dlp needs for YouTube challenges (EJS / PO-token)
ENV DENO_INSTALL=/usr/local
RUN curl -fsSL https://deno.land/install.sh | sh

# Full yt-dlp with impersonation support (TikTok extractor needs curl_cffi)
RUN pip install --no-cache-dir --break-system-packages yt-dlp curl_cffi
ENV YT_DLP_PATH=/usr/local/bin/yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "index.js"]
