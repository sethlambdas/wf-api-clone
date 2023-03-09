####################################
### BASE
####################################
FROM node:18-alpine as base

LABEL org.opencontainers.image.authors=devs@lambdas.io
LABEL org.opencontainers.image.title="Node.js images"
LABEL io.lambdas.nodeversion=$NODE_VERSION

ENV NODE_ENV=production

EXPOSE 3001

ENV PORT 3001

WORKDIR /app

COPY package*.json ./

RUN npm config list

RUN npm ci --silent --legacy-peer-deps \
    && npm cache clean --force

ENV PATH /app/node_modules/.bin:$PATH

RUN apk add --no-cache tini
RUN apk add curl

RUN addgroup appgroup \
    && adduser -G appgroup -D appuser

ENTRYPOINT ["tini", "--", "sh","./entrypoint.sh"]

# CMD ["node", "main.js"]

####################################
### DEV
####################################
FROM base as dev

ENV NODE_ENV=production
# ENV AWS_SECRET_ACCESS_KEY sampleSecretAccessKey
# ENV AWS_ACCESS_KEY_ID sampleAccessKeyId
# ENV AWS_REGION ap-southeast-2
# ENV WORKFLOW_QUEUE WORKFLOW_QUEUE
# ENV WORKFLOW_QUEUE_ERROR WORKFLOW_QUEUE_ERROR

#RUN apt-get update -qq && apt-get install -qy \
RUN apk add --no-cache \
    ca-certificates \
    bzip2 \
    curl

RUN npm config list

RUN npm install --only=development --legacy-peer-deps \
    && npm cache clean --force

RUN chown -R appuser:appgroup /app

USER appuser

CMD ["nodemon"]

####################################
### TEST
####################################
FROM dev as test

COPY . .

# TODO: fix later
# RUN npm audit --audit-level=critical

# ARG MICROSCANNER_TOKEN

# ADD https://get.aquasec.com/microscanner /

USER root

# RUN chmod +x /microscanner

# RUN /microscanner $MICROSCANNER_TOKEN --continue-on-failure

####################################
### PRE PRODUCTION
####################################
FROM test as pre-prod

RUN npm run build

RUN rm -rf ./test* \
    && rm -rf ./node_modules

####################################
### PRODUCTION
####################################
FROM base as prod

ENV AWS_SECRET_ACCESS_KEY=YOURSECRETACCESSKEY
ENV AWS_ACCESS_KEY_ID=YOURACCESSKEYID
RUN apk add --no-cache python3 py-pip jq \
    && pip install awscli

COPY --from=pre-prod /app/config/default.yml /app/config/
COPY --from=pre-prod /app/config/production.yml /app/config/
COPY --from=pre-prod /app/dist /app
COPY --from=pre-prod /app/entrypoint.sh /app

RUN chown -R appuser:appgroup /app

RUN chmod +x /app/entrypoint.sh

USER appuser:appgroup
