# Quest Tracker — container image (optional alternative to Render's
# native Node runtime; useful for Fly.io / any Docker host).
# Build:  docker build -t quest-tracker .
# Run:    docker run -p 3000:3000 -e PI_SANDBOX=true quest-tracker
# The app has zero npm dependencies; the only runtime need is Node 18+.
FROM node:24-slim
WORKDIR /app
COPY package.json ./
# No dependencies to install, but keep the step so the layer cache works
# if dependencies are ever added.
RUN npm install --omit=dev || true
COPY server.js ./
COPY public ./public
COPY data ./data
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
