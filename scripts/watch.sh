#!/bin/bash

source $OS_EXTRAS/bash/bash-utils.sh

Stage "Watch"

Step "Prepare the env"
Task "Set working directory"
cd $OS_BUILD/src

Task "Set path to node bin directory"
PATH=$PATH:./node_modules/.bin/
Task "End prepare the env step"

Step "Prepare the app" 
Task "Check if set clean env before process with run the app"
if [ "$WATCH_DO_CLEAN" = true ] ; then
    Task "Delete contnet of build watch dir"
    /os/bin/clean.sh

    Task "Check if exist compressed file with build libs, if yes decompress it, if not donwload build libs"
    if [ -f ./node_packages.tar.xz ]; then
        Task "Decompress build libs"
        tar xf node_packages.tar.xz
    else
        Task "Install build libs "
        npm install
    fi
fi
Task "End prepare the app step"


Step "Configure the local app server" 

# this task is only to be sure that we don't loose original config file
Task "Check if original project config was modified"
if [ -f ./ionic.config.old.json ]; then
    Task "Restore original project config file"
    rm -rf ./ionic.config.json
    mv ./ionic.config.old.json ./ionic.config.json
fi

Task "Move original file to old file"
mv $OS_BUILD/src/ionic.config.json $OS_BUILD/src/ionic.config.old.json

Task " Copy oliverstore config file to root of project"
cp $OS_BUILD/etc/config/bipper/ionic.config.json $OS_BUILD/src/
Task "End configure the local app server step"

Step "Watch"
ionic-app-scripts serve
