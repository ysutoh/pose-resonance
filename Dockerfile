# Use the official Node.js image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install zip utility for Amplify deployment packaging
RUN apt-get update && apt-get install -y zip && rm -rf /var/lib/apt/lists/*

# The rest of the setup is handled by docker-compose volumes to keep host and container in sync
# Entrypoint will be defined in docker-compose.yml
