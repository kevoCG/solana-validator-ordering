FROM node:24-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and configurations
COPY tsconfig.json ./
COPY src/ ./src/
COPY data/ ./data/

# Compile TypeScript
RUN npm run build

# Default execution runs safe dry-run analysis
ENTRYPOINT ["node", "dist/cli.js"]
CMD ["--dry-run", "--sample-count", "2"]
