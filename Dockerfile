FROM node:20-bookworm-slim

ENV NODE_ENV=production

# Set the working directory
WORKDIR /app

# Install dependencies first so they are cached between code changes
COPY package.json ./
RUN npm install --omit=dev

# Copy the application code
COPY . /app

# Default port; override with the PORT environment variable
EXPOSE 3000

# Runs database migrations, then starts the server
CMD ["npm", "start"]
