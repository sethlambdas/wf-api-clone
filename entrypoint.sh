#!/bin/sh

# env file
echo "reading environment for ${ENV}"
aws ssm get-parameter --region ap-southeast-2 --name "/workflow-api/${ENV}/envs" --with-decrypt | jq --raw-output ".Parameter.Value" > .env

# export from file to local environment
echo "exporting .env file to local environment"
export $(cat .env | sed 's/#.*//g' | xargs)


# Run based on the stuff
echo "starting app"
node main.js