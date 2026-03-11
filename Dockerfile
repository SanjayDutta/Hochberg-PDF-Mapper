FROM node:20-alpine

WORKDIR /app

# Install dependencies first (leverages Docker layer caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

EXPOSE 3000
ENV PORT=3000

# Start the Next.js development server
CMD ["npm", "run", "dev"]
