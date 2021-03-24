#!/bin/bash

source $OS_EXTRAS/bash/bash-utils.sh

Stage "Cleanup project"

Step "Cleanup env"

Task "Cleaning the target directory"
rm -rf $OS_TARGET/*

Task "Enter src directory" 
cd $OS_BUILD/src

Task "Cleaning the local build directory"
rm -rf www/*

Task "Cleaning the node modules directory"
rm -rf node_modules/

Step "Cleanup source structure"

if [ -f ./ionic.config.old.json ]; then
  Task "Restore original project config file"
  rm -rf ./ionic.config.json
  mv ./ionic.config.old.json ./ionic.config.json
fi

Step "End of cleanup stage"