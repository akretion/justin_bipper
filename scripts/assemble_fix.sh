#!/bin/bash

# clear target directory
/os/bin/clean.sh

# assemble webapp and put in proper directory
cd $OS_BUILD/src

# decompress node libs package
tar xf node_packages.tar.xz

npm install

# add path to exec
PATH=$PATH:./node_modules/.bin/

# build the project
npm run build

# copy build project to dist directory
cp -R www/* $OS_TARGET
