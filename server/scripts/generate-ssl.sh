#!/bin/bash

# Create SSL directory if it doesn't exist
mkdir -p ssl

# Generate SSL certificate and private key
openssl req -x509 \
  -newkey rsa:4096 \
  -keyout ssl/server.key \
  -out ssl/server.cert \
  -days 365 \
  -nodes \
  -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=localhost"

echo "✅ SSL certificate and key generated successfully"
echo "📁 Location: ./ssl/"
echo "⚠️  Note: This is a self-signed certificate for development only"
