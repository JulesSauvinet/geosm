#!/bin/sh

hg pull
hg up

# Install npm modules
npm install --production

# Install bower modules
cd public
bower install --production
cd ..
