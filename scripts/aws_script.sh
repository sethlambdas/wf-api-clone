#!/bin/bash

# Set the AWS profile and region (modify these according to your AWS configuration)
AWS_PROFILE="lambdas"
AWS_REGION="ap-southeast-2"
ORG="ORG#"

#API NAME
api_names=$(aws apigateway get-rest-apis --profile $AWS_PROFILE --region $AWS_REGION --query "items[?contains(name, '$ORG')].[id]" --output text)

for api_name in $api_names; do
  echo "Deleting API: $api_name"
  aws apigateway delete-rest-api --profile $AWS_PROFILE --region $AWS_REGION --rest-api-id $api_name
  sleep 10
done
#API USAGE PLANS
plans=$(aws apigateway get-usage-plans --profile $AWS_PROFILE --region $AWS_REGION --query "items[?contains(name, '$ORG')].[id]" --output text)

for plan in $plans; do
  echo "Deleting API Usage Plan: $plan"
  aws apigateway delete-usage-plan --profile $AWS_PROFILE --region $AWS_REGION --usage-plan-id $plan
  sleep 10
done
#API KEYS
api_keys=$(aws apigateway get-api-keys --profile $AWS_PROFILE --region $AWS_REGION --query "items[?contains(name, '$ORG')].[id]" --output text)
for api_key in $api_keys; do
  echo "Deleting API Key: $api_key"
  aws apigateway delete-api-key --profile $AWS_PROFILE --region $AWS_REGION --api-key $api_key
  sleep 10
done

# DYNAMODB Tables
TABLE_NAMES=("auth-organizations" "auth-users"  "workflow" "workflow-executions" "workflow-versions")
# "auth-organizations" "auth-users"  "workflow" "workflow-executions" "workflow-versions"
for TABLE_NAME in "${TABLE_NAMES[@]}"; do
  echo "Processing table: $TABLE_NAME"

  # Determine if the table has a sort key
  HAS_SK=false
  if [ "$TABLE_NAME" = "workflow" ] || [ "$TABLE_NAME" = "workflow-executions" ] || [ "$TABLE_NAME" = "workflow-versions" ]; then
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


    # if table name is workflow remove the rule if time triggered
    if [ "$TABLE_NAME" = "workflow" ]; then
      RULE_NAME=$(echo "$result" | jq -r '.Items[0].TimeTriggerRuleName.S')
      # Get the list of targets associated with the rule
      TARGETS_JSON=$(aws events list-targets-by-rule \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --rule $RULE_NAME)

      # Check if there are targets associated with the rule
      if [[ $TARGETS_JSON == *"\"Targets\": []"* ]]; then
        echo "No targets found for rule '$RULE_NAME'."
      else
        # Extract the target IDs from the JSON response
        TARGET_IDS=$(echo $TARGETS_JSON | jq -r '.Targets[].Id')

        # Loop through and remove each target
        for TARGET_ID in $TARGET_IDS; do
          echo "Removing target $TARGET_ID from rule '$RULE_NAME'..."
          aws events remove-targets \
            --profile $AWS_PROFILE \
            --region $AWS_REGION \
            --rule $RULE_NAME \
            --ids $TARGET_ID
        done
      fi

      # Delete the EventBridge rule
      aws events delete-rule \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --name $RULE_NAME

      # Check the exit status to see if the rule deletion was successful
      if [ $? -eq 0 ]; then
        echo "Rule '$RULE_NAME' deleted successfully."
      else
        echo "Failed to delete rule '$RULE_NAME'."
      fi
    fi

    # Extract the SK value using jq
    PK_VALUE_MAIN=$(echo "$result" | jq -r '.Items[0].PK.S')
    SK_VALUE_MAIN=$(echo "$result" | jq -r '.Items[0].SK.S')

    echo "PK Value: $PK_VALUE_MAIN"
    echo "SK Value: $SK_VALUE_MAIN"

    # do another scanning of the workflow-versions table to get the other items based on the SK Value
    wv_filter_expression="contains(PK, :val)"
    wv_expression_attribute_values="{\":val\": {\"S\": \"$SK_VALUE_MAIN\"}}"
    wv_result=$(aws dynamodb scan \
      --profile $AWS_PROFILE \
      --region $AWS_REGION \
      --table-name $TABLE_NAME \
      --filter-expression "$wv_filter_expression" \
      --expression-attribute-values "$wv_expression_attribute_values" \
      --max-items 25)  
    echo wv_result: $wv_result 


    # remove the main item for workflow-versions
    if [ "$TABLE_NAME" = "workflow-versions" ]; then
      aws dynamodb delete-item \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --table-name $TABLE_NAME \
        --key "{\"PK\": {\"S\": \"$PK_VALUE_MAIN\"}, \"SK\": {\"S\": \"$SK_VALUE_MAIN\"}}"
    fi


    # Loop through the results and DELETE each item
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
        
        # Extract the "WX#..." part from PK_VALUE_MAIN of workflow-executions to remove the workflow-execution that has SK of WX#...
        WX_VALUE=$(echo "$PK" | cut -d'|' -f2)
        aws dynamodb delete-item \
            --profile $AWS_PROFILE \
            --region $AWS_REGION \
            --table-name $TABLE_NAME \
            --key "{\"PK\": {\"S\": \"$PK\"}, \"SK\": {\"S\": \"$WX_VALUE\"}}"

      done < <(echo "$result" | jq -r '.Items[] | .PK.S, .SK.S')
    elif [ "$TABLE_NAME" = "workflow-versions" ]; then
      while read -r PK && read -r SK; do
        echo "Deleting item with PK/SK: $PK / $SK"
        aws dynamodb delete-item \
            --profile $AWS_PROFILE \
            --region $AWS_REGION \
            --table-name $TABLE_NAME \
            --key "{\"PK\": {\"S\": \"$PK\"}, \"SK\": {\"S\": \"$SK\"}}"
      done < <(echo "$wv_result" | jq -r '.Items[] | .PK.S, .SK.S')
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
