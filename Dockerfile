FROM nginxinc/nginx-unprivileged:1.27-alpine

USER root

COPY nginx.conf /etc/nginx/nginx.conf
COPY index.html app.js styles.css /usr/share/nginx/html/
COPY brief/ /usr/share/nginx/html/brief/
COPY brand/ /usr/share/nginx/html/brand/
COPY data/ /usr/share/nginx/html/data/
COPY photos/ /usr/share/nginx/html/photos/

RUN printf 'ok\n' > /usr/share/nginx/html/healthz \
    && chown -R nginx:nginx /usr/share/nginx/html

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
