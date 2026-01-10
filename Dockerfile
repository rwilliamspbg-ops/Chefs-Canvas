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

# Stage 2: Production - Single Node.js server
FROM node:18-alpine

WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/

# Install server dependencies
WORKDIR /app/server
RUN npm install --production

# Copy server code
COPY server/ .

# Copy built frontend files to server's public directory
COPY --from=build-frontend /app/dist ../public

# Expose port
EXPOSE 3001

# Set working directory back to server
WORKDIR /app/server

# Start the Node.js server (it will serve both API and static files)
CMD ["node", "index.js"]
