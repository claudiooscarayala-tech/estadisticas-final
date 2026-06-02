FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y python3 make g++ gcc

WORKDIR /app

COPY . .

RUN bash railway-build.sh

CMD ["bash", "railway-start.sh"]
