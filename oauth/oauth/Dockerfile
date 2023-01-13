FROM node:18-slim

ENV TARGET_USERNAME Chillvibes
ENV PASSWORD 0cce74ebdb6de769e670d136424e112392f1b99f1d634fb5b56eafef2f7fd9f0c7849129e9971cec8d483de581458131e6e107b57856527e586d1d68759ab268
ENV CLIENT_ID 37147ef3-fdb8-4f7e-8de2-2852be5194ab
ENV CLIENT_SECRET da3d2979d0cd84e8fc8beb47e94492cc75fb5fadd1fec2f526996bef24c25b45
ENV APP_NAME "Chillvibes' Vault"
ENV REDIRECT http://localhost:3000/oauth2/callback

RUN apt-get update \
    && apt-get install -y supervisor

WORKDIR '/app'
COPY . .
RUN mv supervisord.conf /etc/supervisord.conf

# RUN chown -R www-data:www-data .
RUN npm install --omit=dev
RUN npx prisma migrate deploy
RUN npm run setup

EXPOSE 3001

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
