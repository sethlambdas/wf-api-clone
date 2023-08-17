# Workflow - API

# Build Badges
- Development
![Build badge](https://s3-extras-bucket-coredocs-workflow-api-dev.s3-ap-southeast-2.amazonaws.com/badges/badge-build-action-build.svg)
![Unit Tests badge](https://s3-extras-bucket-coredocs-workflow-api-dev.s3-ap-southeast-2.amazonaws.com/badges/badge-unit-test-action-build.svg)
![E2E Tests badge](https://s3-extras-bucket-coredocs-workflow-api-dev.s3-ap-southeast-2.amazonaws.com/badges/badge-e2e-test-action-build.svg)
![Deployment status badge](https://s3-extras-bucket-coredocs-workflow-api-dev.s3-ap-southeast-2.amazonaws.com/badges/badge-deployment-status.svg)


## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Prerequisites

You'll need to have Node 12.0.0 or up. We recommend upgrading to the LTS version of NodeJS available at [https://nodejs.org/](https://nodejs.org/). You can also use [nvm](https://github.com/creationix/nvm#installation) (macOS/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows#node-version-manager-nvm-for-windows) to switch Node versions between different projects.

## Installation

```bash
# install dependencies
npm install
```

## Running the app

```bash
# development
$ npm run start

# development (docker mode using docker compose)
$ npm run start:docker

# development (watch mode)
$ npm run watch

# production mode
$ npm run start:prod
```

## Test

```bash
# e2e and unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# unit tests
$ npm run test:unit

# e2e tests (watch mode)
$ npm run test:watch:e2e

# unit tests (watch mode)
$ npm run test:watch:unit
```

## Run dynamodb-admin viewer

1. Run `npm install -g dynamodb-admin`
2. Run localstack with dynamodb service
3. set env `$env:DYNAMO_ENDPOINT = "http://localhost:4566"` (for windows)
4. Check env if set `Get-ChildItem Env:DYNAMO_ENDPOINT`
5. If all good then Run `dynamodb-admin`

### Examples on using query builder, pagination and sorting

Import the postman collection (`nestjs-template.postman_collection.json`) from `docs/postman` folder to [postman](https://www.postman.com/downloads/) app for more detailed example requests and responses.

```javascript
{
    "listTasksFilterInput": {
        "filter": [
            {
                "id": [1]
            }
        ],
        "operators": [
            {
                "id": "In"
            }
        ],
        "sorting": {
            "sortBy": ["id"],
            "sortDir": ["DESC"]
        },
        "pagination": {
            "page": 1,
            "pageSize": 20
        }
    }
}
```

- **filter** - an array of objects based on the `key` as the property of entity and `value` as the data to be queried / filtered
- **operators** - an array of objects based on the `key` as the property of entity and `value` as the [find operators](https://github.com/lambdas-crew/nestjs-template-project/blob/master/src/graphql/common/enums/options-operator.enum.ts)
- **sorting**
  - `sortBy` - based on the property of the entity to be sorted
  - `sortDir` - based on the sort direction (`ASC`, `DESC`)
- **pagination**
  - `page` - offset (paginated) from where entities should be taken
  - `pageSize` - limit (paginated) number of entities should be taken

## CRUD Generator

Generate module, resolver, service, entity and DTO objects based on the model / table in the following steps.

### 1) Generating new resource

<pre>
$ npm run generate:resource graphql/<b>entities</b>
</pre>

- **entities** - replace with the entity on plural form like (`products`, `users`) you want to generate

### 2) Transport layer - GraphQL (code first)

<pre>
? What transport layer do you use? 
  REST API 
❯ <b>GraphQL (code first)</b>
  GraphQL (schema first) 
  Microservice (non-HTTP) 
  WebSockets
</pre>

### 3) Generate CRUD entry

<pre>
? Would you like to generate CRUD entry points? (Y/n) <b>Y</b>
</pre>

### 4) Generated resource entity files

```bash
CREATE src/graphql/products/products.module.ts
CREATE src/graphql/products/products.resolver.ts
CREATE src/graphql/products/products.service.ts
CREATE src/graphql/products/dto/create-product.input.ts
CREATE src/graphql/products/dto/update-product.input.ts
CREATE src/graphql/products/entities/product.entity.ts
UPDATE src/graphql/app.module.ts
```

### 5) Modify CRUD resolver names and Update repository logics

- Rename the generated CRUD resolver method names according to `task.resolver` CRUD logics
- Update generated service according to `task.service` CRUD logics
- Add repository entity according to `task.repository` CRUD logics

## Configuration

Configs such as (`DB credentials`, `server config`, `authentication config`) are located on `config` folder on which the place to update / store configuration variables that are based on different environments.

## Commit Standards

### Commit Convention

<pre>
$ git commit -m "<b>type</b>(<b>ticket-number</b>): <b>description</b>"
</pre>

- **type** - types like (`feat`, `fix`) related on the ticket
- **ticket-number** - identity number related on the ticket
- **description** - message body related on the ticket

### Linting and Consistent Style

```bash
# automatically find and fix lint errors
$ npm run lint:fix

# automatically rewrites unformatted files
$ npm run prettier:fix
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## DOCKER AWS Auth

sudo docker login -u AWS -p $(aws ecr get-login-password --region ap-southeast-2) 610780540569.dkr.ecr.ap-southeast-2.amazonaws.com

## PUSH DOCKER IMAGE TO AWS ECR
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 917209780752.dkr.ecr.ap-southeast-2.amazonaws.com

## GENERATE DOCKER IMAGE
docker build --rm -t wf-api:latest .

## EXPORT ENV VARIABLES (development)
export AWS_SECRET_ACCESS_KEY=sampleSecretAccessKey
export AWS_ACCESS_KEY_ID=sampleAccessKeyId
export AWS_REGION=ap-southeast-2
export WORKFLOW_QUEUE=WORKFLOW_QUEUE
export WORKFLOW_QUEUE_ERROR=WORKFLOW_QUEUE_ERROR

## CREATE APIGATEWAY TEMPLATE USING AWS CLI

awslocal apigateway create-rest-api --name clone-1 --description "clone for the default authorizer"

awslocal apigateway create-resource --rest-api-id bqf818n6fj  --parent-id bqf818n6fj --path-part ""

awslocal apigateway create-resource --rest-api-id bqf818n6fj  --parent-id 577f9kxohh --path-part "trigger"

awslocal apigateway create-resource --rest-api-id bqf818n6fj --parent-id yyxomkew25 --path-part "{aid}"

awslocal apigateway put-method --rest-api-id bqf818n6fj --resource-id 4lkgy5rhv5 --http-method POST --authorization-type "NONE"

awslocal apigateway put-integration --rest-api-id bqf818n6fj --resource-id 4lkgy5rhv5 --http-method POST --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:ap-southeast-2:lambda:path/2015-03-31/functions/arn:aws:lambda:ap-southeast-2:000000000000:function:srvls-authorizer-svc-local-authorizerFunc/invocations"

<!-- deployment -->
awslocal apigateway create-deployment --rest-api-id bqf818n6fj --stage-name local

<!-- stage -->
awslocal apigateway create-stage --rest-api-id bqf818n6fj --stage-name local --deployment-id xaz2vorl2z

<!-- usage plans -->
awslocal apigateway create-usage-plan --name "Basic Plan" --description "Basic usage plan" --api-stages "apiId=bqf818n6fj,stage=local"

awslocal apigateway create-api-key --name "ApiKeyForBasicPlan" --description "API key for BasicPlan usage plan"

awslocal apigateway create-usage-plan-key --usage-plan-id t0eooakcev --key-id l1s1vshbcn --key-type "API_KEY"

<!-- to enable api key -->
awslocal apigateway update-api-key --api-key frzetdph2l --patch-operations op='replace',path='/enabled',value='false'

<!-- to know the usageplan quoata/limit -->
awslocal apigateway get-usage-plan --usage-plan-id wlcrdmeuwy

awslocal apigateway update-usage-plan --usage-plan-id wlcrdmeuwy --patch-operations op="add",path="/quota/limit",value="1"

awslocal apigateway update-usage-plan --usage-plan-id wlcrdmeuwy --patch-operations op="replace",path="/quota/period",value="MONTH"

awslocal apigateway update-usage-plan --usage-plan-id wlcrdmeuwy --patch-operations op="replace",path="/throttle/rateLimit",value="1"

awslocal apigateway update-usage-plan --usage-plan-id wlcrdmeuwy --patch-operations op="replace",path="/throttle/burstLimit",value="1"
<!-- to get the usage -->
awslocal apigateway get-usage --usage-plan-id wlcrdmeuwy --key-id tx5o9t2plk --start-date "2023-08-01T00:00:00Z" --end-date "2023-08-02T00:00:00Z"

<!-- localstack -->
wwywvfmhwulmho@exelica.com
Password123!

awslocal apigateway get-api-key --api-key tx5o9t2plk