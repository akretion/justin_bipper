#!/bin/bash

# clear target directory
/os/bin/clean.sh

# install all node dep
npm install

# add path to exec
PATH=$PATH:./node_modules/.bin/

# move original file to old file
mv ./ionic.config.json ./ionic.config.old.json

# copy oliverstore config file to root of project
cp $OS_BUILD/etc/config/ionic.config.json ./

# watch
ionic-app-scripts serve
