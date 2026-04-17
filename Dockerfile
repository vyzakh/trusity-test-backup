FROM node:20-alpine
WORKDIR /app

# 1. Install System Tools
RUN apk add --no-cache \
    chromium nss freetype harfbuzz ca-certificates \
    libreoffice ttf-freefont bash \
    && rm -rf /var/cache/apk/*

# 2. Install Dependencies
# Remove --production for now because we need 'devDependencies' (like nest-cli) to build
COPY package*.json ./
RUN npm install

# 3. Copy Code and BUILD
COPY . .
RUN npm run build  # <--- THIS IS THE MISSING PIECE

# 4. Optional: Clean up devDependencies to save space
RUN npm prune --production

# Set environment for Chromium
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

EXPOSE 3000
CMD ["node", "dist/main"]
