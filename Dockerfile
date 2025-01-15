FROM node:bookworm

# Set the working directory
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in package.json
RUN npm install

# Make port 3000 available to the world outside this container
EXPOSE $PORT

# Run app.js when the container launches
CMD ["node", "server.js"]