#!/bin/sh

if [ -f node.pid ] ; then
	kill $(cat node.pid)
fi

# pkill node $INDEXJS
node index.js >> node.log 2>&1 &
echo $! > node.pid
