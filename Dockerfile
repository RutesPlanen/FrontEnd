FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY login.html /usr/share/nginx/html/login.html
COPY restauranter.html /usr/share/nginx/html/restauranter.html
COPY brugere.html /usr/share/nginx/html/brugere.html
COPY anmodninger.html /usr/share/nginx/html/anmodninger.html
COPY afhentninger.html /usr/share/nginx/html/afhentninger.html
COPY restaurant-dashboard.html /usr/share/nginx/html/restaurant-dashboard.html
COPY chauffeur-dashboard.html /usr/share/nginx/html/chauffeur-dashboard.html
COPY map.html /usr/share/nginx/html/map.html
COPY kosten.html /usr/share/nginx/html/kosten.html
COPY statistik.html /usr/share/nginx/html/statistik.html
COPY udgifter.html /usr/share/nginx/html/udgifter.html
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
