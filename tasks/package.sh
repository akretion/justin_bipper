#!/bin/bash

# 
# INCLUDES 
# 

source extras/bash/bash-utils.sh

# 
# VARS
# 

_DIST_DIR="${GPS_PROJECT_DIR}/.dist"

_BUILD_ARGS_OPTS="\
  --build-arg  COMPONENT_NAME=${GPS_COMPONENT_NAME}\
  --build-arg  COMPONENT_TYPE=${GPS_COMPONENT_TYPE}\
  --build-arg  BIPPER_PROXY_URL=odoo.olst.io\
"

# 
# LOGIC
# 

Stage "Package"

Step "Login to AWS ECR"
eval `aws ecr get-login --region eu-west-1 --profile default | sed -e 's/-e\ none//g'`

Step "Build the docker image"
docker rmi ${GPS_PROJECT_DOCKER_IMAGE_URL}:latest
docker build --no-cache --force-rm  -f ${GPS_PROJECT_DIR}/etc/docker/Dockerfile  ${_BUILD_ARGS_OPTS}  -t ${GPS_PROJECT_DOCKER_IMAGE_URL} ${GPS_PROJECT_DIR}

Check_errors $?

Done

exit 0

