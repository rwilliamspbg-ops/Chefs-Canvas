startup.sh  #!/bin/sh
set -e

# Set default port if PORT not set by Railway
PORT=${PORT:-8080}

echo "Starting services on PORT: $PORT"

# Update nginx config to listen on the correct port
sed -i "s/listen 80;/listen $PORT;/g" /etc/nginx/http.d/default.conf

# Start nginx in background
nginx &

echo "Nginx started on port $PORT"

# Start Node.js backend
cd /app/server && PORT=3001 node index.js
