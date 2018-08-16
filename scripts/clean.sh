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
