# Use an official Node runtime as a parent image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run the app when the container launches
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
