#!/bin/bash

# clear target directory
rm -rf $OS_TARGET/*

# enter justin dir
cd $OS_BUILD/src/justin

# remove old build
rm -rf www/*

# remove all old node modules
rm -rf node_modules/

# check if original project config was modified
if [ -f ./ionic.config.old.json ]; then
  # restore original project config file
  rm -rf ./ionic.config.json
  mv ./ionic.config.old.json ./ionic.config.json
fi

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
