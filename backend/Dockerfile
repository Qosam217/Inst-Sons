# Base image Linux Node.js 20 Bullseye Slim
FROM node:20-bullseye-slim

# Install system dependencies: ffmpeg and python3 (required for yt-dlp & audio conversion)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Ensure temp directory exists with proper permissions
RUN mkdir -p /app/temp

# Expose API port
EXPOSE 5000

# Environment defaults
ENV NODE_ENV=production
ENV PORT=5000

# Start server
CMD ["npm", "start"]
