FROM node:18-alpine
WORKDIR /app

# Copy package files and install dependencies
# Note: We use package*.json to catch both package.json and package-lock.json if it exists
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Force Port 3000
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]