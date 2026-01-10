# Chef's Canvas - Deployment Guide

This project is configured to be packaged and deployed to a Linux server using Docker.

**Note:** This project now uses **Perplexity AI API** instead of Google Gemini.

## Get Your Perplexity API Key

1. Visit [Perplexity API Settings](https://www.perplexity.ai/settings/api)
2. Sign up or log in to your Perplexity account
3. Generate a new API key
4. Copy the API key for use in the deployment steps below

## Local Development

1. Install dependencies: `npm install`
2. Set your Perplexity API key:
   ```bash
   export PERPLEXITY_API_KEY="your-api-key-here"
   ```
3. Start development server: `npm run dev`

## Deployment with Docker (Recommended for Linux)

### 1. Build the Image

From the project root, run the following command. Replace `YOUR_PERPLEXITY_API_KEY` with your actual Perplexity API Key.

```bash
docker build --build-arg PERPLEXITY_API_KEY=YOUR_PERPLEXITY_API_KEY -t chefs-canvas .
```

### 2. Run the Container

```bash
docker run -d -p 8080:80 chefs-canvas
```

The app will now be accessible at `http://your-server-ip:8080`.

## Manual Deployment (Static Hosting)

1. Run `npm run build` locally (ensure `PERPLEXITY_API_KEY` environment variable is set in your terminal).
2. Upload the contents of the `dist/` folder to your Linux server (e.g., using SCP or FTP to `/var/www/html`).
3. Configure your web server (Nginx/Apache) to serve `index.html` for all routes.

## API Features

### Available Features
- ✅ Recipe parsing from text input
- ✅ Recipe extraction and structuring
- ✅ AI-powered recipe analysis using Perplexity models (llama-3.1-sonar)

### Limitations
- ❌ Image generation (Perplexity doesn't support image generation)
- ❌ Video generation (Perplexity doesn't support video generation)
- ❌ Image-based recipe extraction (requires vision API integration)

### Future Enhancements

To add image/video generation capabilities, you can integrate:
- **DALL-E** (OpenAI) for image generation
- **Stable Diffusion** for image generation
- **Runway ML** or similar services for video generation

## Troubleshooting

- Make sure your Perplexity API key is valid and has sufficient credits
- Check that environment variables are properly set
- For Docker deployments, verify the API key is passed as a build argument
