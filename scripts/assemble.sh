#!/bin/bash

# clear target directory
rm -rf $OS_TARGET/*


# assemble webapp and put in proper directory
cd $OS_BUILD/src/justin

# remove old build
rm -rf www/*

# tail -f /dev/null

# remove all old node modules
rm -rf node_modules/

# install all node dep
npm install

# add path to exec
PATH=$PATH:./node_modules/.bin/

# build the project
npm run build

# copy build project to dist directory
cp -R www/* $OS_TARGET
