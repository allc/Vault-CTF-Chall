FROM node:18-slim

ENV TARGET_USERNAME Chillvibes
ENV PASSWORD 0cce74ebdb6de769e670d136424e112392f1b99f1d634fb5b56eafef2f7fd9f0c7849129e9971cec8d483de581458131e6e107b57856527e586d1d68759ab268
ENV CSRF_SECRET ac993c72267193b918e9cc7b9b1722c477e71c0e501d8b11ac76af3ecd60de1326e0458743ff1c37cafff5afc95007ba7eb33d2f62144aba2875f74ee8bd87bd
ENV CLIENT_ID 37147ef3-fdb8-4f7e-8de2-2852be5194ab
ENV CLIENT_SECRET da3d2979d0cd84e8fc8beb47e94492cc75fb5fadd1fec2f526996bef24c25b45
ENV APP_NAME "Chillvibes' Vault"
ENV REDIRECT http://localhost:3000/oauth2/callback
ENV SESSION_SECRET 6429c4e716e1bc7a94f33f7ff009a94dc4e203b3af0c69d5efb27a25cad7ffad53cc90464f5001f1251eb9dd94ec56ccc94ccd7df663a52c15898711fdc22aa6
ENV OAUTH_API_ENDPOINT http://localhost:3001/oauth2

RUN apt-get update \
    && apt-get install -y supervisor \
    && apt-get install -y libgbm-dev libglib2.0-0 libnss3 libatk1.0-0 libcups2 libx11-6 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 libpango-1.0-0 libcairo2 libasound2 libatk-bridge2.0-0 libxkbcommon-x11-0

# USER node
WORKDIR '/app'
COPY . .
# RUN npm install --omit=dev
RUN npm install
RUN npx prisma migrate deploy
RUN npm run setup

# USER root
RUN mv supervisord.conf /etc/supervisord.conf
EXPOSE 3001
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
