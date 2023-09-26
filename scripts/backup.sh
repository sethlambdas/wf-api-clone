#!/bin/bash

# Set the AWS profile and region (modify these according to your AWS configuration)
AWS_PROFILE="lambdas"
AWS_REGION="ap-southeast-2"
ORG="ORG#022089e2-bab1-4ae2-975a-98fd92f69f04"

#API NAME
# api_names=$(aws apigateway get-rest-apis --profile $AWS_PROFILE --region $AWS_REGION --query "items[?contains(name, '$ORG')].[id]" --output text)

# for api_name in $api_names; do
#   echo "Deleting API: $api_name"
#   aws apigateway delete-rest-api --profile $AWS_PROFILE --region $AWS_REGION --rest-api-id $api_name
#   sleep 10
# done
# #API USAGE PLANS
# plans=$(aws apigateway get-usage-plans --profile $AWS_PROFILE --region $AWS_REGION --query "items[?contains(name, '$ORG')].[id]" --output text)

# for plan in $plans; do
#   echo "Deleting API Usage Plan: $plan"
#   aws apigateway delete-usage-plan --profile $AWS_PROFILE --region $AWS_REGION --usage-plan-id $plan
#   sleep 10
# done
# #API KEYS
# api_keys=$(aws apigateway get-api-keys --profile $AWS_PROFILE --region $AWS_REGION --query "items[?contains(name, '$ORG')].[id]" --output text)
# for api_key in $api_keys; do
#   echo "Deleting API Key: $api_key"
#   aws apigateway delete-api-key --profile $AWS_PROFILE --region $AWS_REGION --api-key $api_key
#   sleep 10
# done

# DYNAMODB Tables
TABLE_NAMES=("auth-organizations" "auth-users"  "workflow" "workflow-executions")
# "auth-organizations" "auth-users"  "workflow" "workflow-executions" "workflow-versions"
for TABLE_NAME in "${TABLE_NAMES[@]}"; do
  echo "Processing table: $TABLE_NAME"

  # Determine if the table has a sort key
  HAS_SK=false
  if [ "$TABLE_NAME" = "workflow" ] || [ "$TABLE_NAME" = "workflow-executions" ]; then
    HAS_SK=true
  fi

  while true; do
    if [ "$HAS_SK" = true ]; then
      echo "HAS SK"
      if [ "$TABLE_NAME" = "workflow-executions" ]; then
        filter_expression="contains(SK, :val)"
        expression_attribute_values="{\":val\": {\"S\": \"$ORG\"}}"
      else
        filter_expression="contains(PK, :val)"
        expression_attribute_values="{\":val\": {\"S\": \"$ORG\"}}"
      fi
    else
      echo "NO SK"
        filter_expression="contains(PK, :val)"
        expression_attribute_values="{\":val\": {\"S\": \"$ORG\"}}"
    fi

    result=$(aws dynamodb scan \
      --profile $AWS_PROFILE \
      --region $AWS_REGION \
      --table-name $TABLE_NAME \
      --filter-expression "$filter_expression" \
      --expression-attribute-values "$expression_attribute_values" \
      --max-items 25)  
    echo result: $result 
    # Loop through the results and delete each item
    if [ "$TABLE_NAME" = "workflow-executions" ]; then
      while read -r PK && read -r SK; do
        echo "Deleting item with PK/SK: $PK / $SK"
        
        if [ "$HAS_SK" = true ]; then
          echo "PK and SK"
          aws dynamodb delete-item \
            --profile $AWS_PROFILE \
            --region $AWS_REGION \
            --table-name $TABLE_NAME \
            --key "{\"PK\": {\"S\": \"$PK\"}, \"SK\": {\"S\": \"$SK\"}}"
        else
          echo "PK ONLY"
          aws dynamodb delete-item \
            --profile $AWS_PROFILE \
            --region $AWS_REGION \
            --table-name $TABLE_NAME \
            --key "{\"PK\": {\"S\": \"$PK\"}}"
        fi
      done < <(echo "$result" | jq -r '.Items[] | .PK.S, .SK.S')
    else
      while read -r PK && read -r SK; do
        echo "Deleting item with PK/SK: $PK / $SK"
        
        if [ "$HAS_SK" = true ]; then
          echo "PK and SK"
          aws dynamodb delete-item \
            --profile $AWS_PROFILE \
            --region $AWS_REGION \
            --table-name $TABLE_NAME \
            --key "{\"PK\": {\"S\": \"$PK\"}, \"SK\": {\"S\": \"$SK\"}}"
        else
          echo "PK ONLY"
          aws dynamodb delete-item \
            --profile $AWS_PROFILE \
            --region $AWS_REGION \
            --table-name $TABLE_NAME \
            --key "{\"PK\": {\"S\": \"$PK\"}}"
        fi
      done < <(echo "$result" | jq -r '.Items[].PK.S' && echo "$result" | jq -r '.Items[].SK.S')
     
    fi

    if [ "$(echo "$result" | jq -r '.LastEvaluatedKey')" = "null" ]; then
      break
    fi
  done

  echo "Finished processing table: $TABLE_NAME"
done

echo "All APIs with 'ORG#' in the name have been deleted."
