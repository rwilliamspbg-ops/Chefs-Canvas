# Stage 1: Build Frontend
FROM node:18 AS build-frontend
WORKDIR /app

# Accept build arg for Perplexity API key
ARG PERPLEXITY_API_KEY

# Copy frontend package files
COPY package*.json ./

# Install frontend dependencies
RUN npm install

# Copy frontend application files
COPY . .

# Build the frontend application with API key embedded
RUN PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY} npm run build

# Stage 2: Production - Node.js with nginx
FROM node:18-alpine

# Install nginx
RUN apk add --no-cache nginx

WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/

# Install server dependencies
WORKDIR /app/server
RUN npm install --production

# Copy server code
COPY server/ .

# Copy built frontend files
COPY --from=build-frontend /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Expose ports (3001 for backend, 80 for frontend)
EXPOSE 3001 80

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'nginx &' >> /start.sh && \
    echo 'cd /app/server && node index.js' >> /start.sh && \
    chmod +x /start.sh

# Start both nginx and Node.js server
CMD ["/start.sh"]

