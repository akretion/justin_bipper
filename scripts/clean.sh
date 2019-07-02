#!/bin/bash

# clear target directory
echo "Cleaning the target directory"
rm -rf $OS_TARGET/*

# enter justin dir
cd $OS_BUILD/src/justin

# remove old build
echo "Cleaning the local build directory"
rm -rf www/*

# remove all old node modules
echo "Cleaning the node modules directory"
rm -rf node_modules/

# check if original project config was modified
echo "Cleaning the source structure"
if [ -f ./ionic.config.old.json ]; then
  # restore original project config file
  rm -rf ./ionic.config.json
  mv ./ionic.config.old.json ./ionic.config.json
fi
