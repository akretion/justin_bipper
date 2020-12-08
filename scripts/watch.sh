#!/bin/bash

# set working dir
cd $OS_BUILD/src

# add path to exec
PATH=$PATH:./node_modules/.bin/

if [ "$WATCH_DO_CLEAN" = true ] ; then
    # delete contnet of build watch dir
    /os/bin/clean.sh

    # install all node dep
    npm install

fi

# check if original project config was modified
if [ -f ./ionic.config.old.json ]; then
    # restore original project config file
    rm -rf ./ionic.config.json
    mv ./ionic.config.old.json ./ionic.config.json
fi

# move original file to old file
mv $OS_BUILD/src/ionic.config.json $OS_BUILD/src/ionic.config.old.json

# copy oliverstore config file to root of project
cp $OS_BUILD/etc/config/bipper/ionic.config.json $OS_BUILD/src/

# watch
ionic-app-scripts serve