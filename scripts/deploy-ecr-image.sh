#!/usr/bin/env bash
set -euo pipefail

log() { echo "[deploy] $(date '+%H:%M:%S') $*"; }

: "${AWS_PROFILE:=my-creds}"
: "${AWS_REGION:=ap-southeast-2}"
: "${CLUSTER:=dokuwiki-prod-cluster}"
: "${SERVICE:=dokuwiki-prod-svc}"
: "${CONTAINER_NAME:=dokuwiki}"
: "${IMAGE:=462634386575.dkr.ecr.ap-southeast-2.amazonaws.com/dokuwiki:latest}"
: "${AWS_PAGER:=}"

log "Starting deployment..."
log "  CLUSTER=$CLUSTER"
log "  SERVICE=$SERVICE"
log "  CONTAINER=$CONTAINER_NAME"
log "  IMAGE=$IMAGE"

if [[ -z "${IMAGE}" ]]; then
  log "ERROR: IMAGE is required"
  exit 1
fi

if [[ "${IMAGE}" == *'$'* ]]; then
  log "ERROR: IMAGE contains an unexpanded variable: ${IMAGE}"
  exit 1
fi

require() {
  command -v "$1" >/dev/null 2>&1 || { log "Missing dependency: $1"; exit 1; }
}

require aws
require jq

export AWS_PROFILE AWS_REGION AWS_PAGER

log "Fetching current task definition..."
current_td_arn="$(aws ecs describe-services \
  --cluster "$CLUSTER" \
  --services "$SERVICE" \
  --query 'services[0].taskDefinition' \
  --output text)"
log "  Current task definition: $current_td_arn"

log "Fetching task definition details..."
td_json="$(aws ecs describe-task-definition --task-definition "$current_td_arn" --query 'taskDefinition')"

current_image="$(echo "$td_json" | jq -r --arg CONTAINER "$CONTAINER_NAME" '.containerDefinitions[] | select(.name == $CONTAINER) | .image')"
log "  Current image: $current_image"

log "Building new task definition with image: $IMAGE"
new_td_json="$(echo "$td_json" | jq \
  --arg IMAGE "$IMAGE" \
  --arg CONTAINER "$CONTAINER_NAME" \
  '
  .containerDefinitions = (.containerDefinitions | map(
    if .name == $CONTAINER then .image = $IMAGE else . end
  ))
  | del(
      .taskDefinitionArn,
      .revision,
      .status,
      .requiresAttributes,
      .compatibilities,
      .registeredAt,
      .registeredBy
    )
  ')"

log "Registering new task definition..."
new_td_arn="$(aws ecs register-task-definition \
  --cli-input-json "$new_td_json" \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)"
log "  New task definition: $new_td_arn"

new_image="$(aws ecs describe-task-definition \
  --task-definition "$new_td_arn" \
  --query 'taskDefinition.containerDefinitions[0].image' \
  --output text)"
log "  New image in task def: $new_image"

log "Updating service to use new task definition..."
aws ecs update-service \
  --cluster "$CLUSTER" \
  --service "$SERVICE" \
  --task-definition "$new_td_arn" >/dev/null

log "Waiting for service to stabilize (this may take a few minutes)..."
log "  You can check status with:"
log "    aws ecs describe-services --cluster $CLUSTER --services $SERVICE --query 'services[0].events[0:3]'"

aws ecs wait services-stable \
  --cluster "$CLUSTER" \
  --services "$SERVICE"

log "✅ Deployment complete!"
log "  Image: $IMAGE"
log "  Task definition: $new_td_arn"