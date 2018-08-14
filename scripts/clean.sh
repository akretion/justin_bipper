#!/bin/bash

# clear target directory
rm -rf $OS_TARGET/*

# enter justin dir
cd $OS_BUILD/src/justin

# remove old build
rm -rf www/*

# remove all old node modules
rm -rf node_modules/

# restore original project config file
rm -rf ./ionic.config.json
mv ./ionic.config.old.json ./ionic.config.json
