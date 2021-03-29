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

Stage "Assemble"

Step "Build the docker image"
docker-compose --version
docker-compose -p ${DEV_PROJECT} -f ${GPS_PROJECT_DIR}/etc/docker/docker-compose.assemble.yml config
docker-compose -p ${DEV_PROJECT} -f ${GPS_PROJECT_DIR}/etc/docker/docker-compose.assemble.yml rm -f assembler
docker-compose -p ${DEV_PROJECT} -f ${GPS_PROJECT_DIR}/etc/docker/docker-compose.assemble.yml up --build --force-recreate --env-file ./.env assembler

Check_errors $?

Done

exit 0