#!/usr/bin/env sh

# Exit immediately if a command exits with a non-zero status
set -e

# Load environment variables from a .env file if it exists
if [ ! -f .env ]; then
  echo "Make sure environment variables exist in .env file"
  exit 1
fi

# Load environment variables from a .env file if it exists
if [ -f .env ]; then
  echo "Loading environment variables from .env file"
  export $(grep -v '^#' .env | xargs)
fi

# Define the tag as a variable (default value if not provided)
TAG=${1:-"latest"}

# Define the image name
IMAGE_NAME="pay-p"

# Build the Docker image
echo "Building Docker image for: $IMAGE_NAME"
echo "Building Docker image with tag: $TAG"
docker build -t $IMAGE_NAME:$TAG .

# Run the Docker container
echo "Running Docker container from image: $IMAGE_NAME:$TAG"
docker run --rm -it --env-file .env -p $PORT:$PORT $IMAGE_NAME:$TAG
