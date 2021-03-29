#!/bin/bash

source $OS_EXTRAS/bash/bash-utils.sh

# Run Cleanup stage before continue with assemble process
/os/bin/clean.sh

Stage "Assemble"
Step "Install libs"
Task "Enter build directory"
cd $OS_BUILD/src

Task "Check if exist compressed file with build libs, if yes decompress it, if not donwload build libs"
if [ -f ./node_packages.tar.xz ]; then
  Task "Decompress build libs"
  tar xf node_packages.tar.xz
else
  Task "Install build libs "
  npm install
fi

Task "Add build libs bin folder to exec PATH"
PATH=$PATH:./node_modules/.bin/

Step "Build app"
Task "Start build process"
npm run build

Task "Copy app to target"
cp -R www/* $OS_TARGET

Step "End of assemble stage"
