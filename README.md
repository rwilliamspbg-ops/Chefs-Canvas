
# Chef's Canvas - Deployment Guide

This project is configured to be packaged and deployed to a Linux server using Docker.

## Local Development
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`

## Deployment with Docker (Recommended for Linux)

### 1. Build the Image
From the project root, run the following command. Replace `YOUR_API_KEY` with your actual Google Gemini API Key.
```bash
docker build --build-arg API_KEY=YOUR_API_KEY -t chefs-canvas .
```

### 2. Run the Container
```bash
docker run -d -p 8080:80 chefs-canvas
```
The app will now be accessible at `http://your-server-ip:8080`.

## Manual Deployment (Static Hosting)
1. Run `npm run build` locally (ensure `API_KEY` environment variable is set in your terminal).
2. Upload the contents of the `dist/` folder to your Linux server (e.g., using SCP or FTP to `/var/www/html`).
3. Configure your web server (Nginx/Apache) to serve `index.html` for all routes.
