FROM nginx:alpine

COPY src/index.html /usr/share/nginx/html/
COPY src/script.js /usr/share/nginx/html/
COPY src/README.md /usr/share/nginx/html/
COPY docker/entrypoint.sh /

RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
