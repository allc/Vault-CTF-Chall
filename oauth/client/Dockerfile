FROM node:current-buster-slim

RUN apt-get update \
    && apt-get install -y supervisor

WORKDIR '/app'
COPY . .
RUN mv supervisord.conf /etc/supervisord.conf
# RUN chown -R www-data:www-data .

RUN npm install --production

EXPOSE 3000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
