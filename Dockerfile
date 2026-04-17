FROM node:20-alpine
WORKDIR /app

# 1. Install System Tools and clean apk cache in one go
RUN apk add --no-cache \
    chromium nss freetype harfbuzz ca-certificates \
    libreoffice ttf-freefont bash \
    && rm -rf /var/cache/apk/*

# 2. Install Dependencies and clean npm cache immediately
COPY package*.json ./
RUN npm install --production --no-audit --no-fund \
    && npm cache clean --force

# 3. Copy only the essential code
# (If you have a 'dist' folder locally, copy that instead of building inside)
COPY . .

# Set environment for Chromium
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

EXPOSE 3000
CMD ["node", "dist/main"]
