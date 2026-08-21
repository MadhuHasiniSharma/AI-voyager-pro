# Step 1: Build the React application
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source code and build the static assets
COPY . .
RUN npm run build

# Step 2: Serve the production build using Nginx
FROM nginx:alpine

# Copy custom build output from builder stage to Nginx web root folder
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80 for Render / local web server
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]