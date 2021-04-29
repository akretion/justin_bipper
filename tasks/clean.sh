#!/bin/bash

# 
# INCLUDES 
# 

source extras/bash/bash-utils.sh

# 
# VARS
# 


# 
# LOGIC
# 

Stage "Cleaning"

CURRENT_WORKING_PATH=$(pwd)
Task "Current working dir is: $CURRENT_PATH"
CONTAINER_NAME="cleaner"

Step "Build the docker image"
docker-compose -p ${DEV_PROJECT} -f ${GPS_PROJECT_DIR}/etc/docker/docker-compose.assemble.yml up --build ${CONTAINER_NAME} 

Check_errors $?

Done

exit 0