#
# Ref: https://learnk8s.io/blog/smaller-docker-images
#
# Build:
#       docker build -t trellobot:0.1 .
# Run:
#       docker run --name trellobot --init trellobot:0.1

#--------------------------------------
# Stage 1: Compile Apps
#--------------------------------------
FROM node:8 as build

WORKDIR /app
COPY package.json ./
RUN npm install

COPY trellobot.js .auth conf.json ./

#--------------------------------------
# Stage 2: Packaging Apps
#--------------------------------------
FROM gcr.io/distroless/nodejs
# FROM node:8-alpine

WORKDIR /app
COPY --from=build /app /app
# EXPOSE 3000

CMD ["trellobot.js"]
