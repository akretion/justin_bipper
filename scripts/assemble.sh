#!/bin/bash

# clear target directory
/os/bin/clean.sh

# assemble webapp and put in proper directory
cd $OS_BUILD/src/justin

# install all node dep
npm install

# add path to exec
PATH=$PATH:./node_modules/.bin/

# build the project
npm run build

# copy build project to dist directory
cp -R www/* $OS_TARGET
