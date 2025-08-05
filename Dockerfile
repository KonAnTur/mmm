FROM node:22

ENV TZ=Europe/Moscow
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Устанавливаем сетевые утилиты для диагностики
RUN apt-get update && apt-get install -y \
    telnet \
    netcat-traditional \
    dnsutils \
    iputils-ping \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /run

COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install

COPY . .

# TODO убрать зависимость от CONTAINER_NAME в коде
ENV CONTAINER_NAME=app
ENV NODE_OPTIONS="--max_old_space_size=4096"

RUN yarn generate:build

CMD ["yarn", "builded:start"]
