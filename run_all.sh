#!/bin/sh
if [ "$1" == "debug" ] || [ "$1" == "" ]; then
    echo "Running debug version."
    npm start --prefix ./front_end/ & cargo run 
elif [ "$1" == "deploy" ]; then
    echo "Running release version."
    npm start --prefix ./front_end/ & cargo run --release
else
    echo "Invalid argument. [debug, deploy]"
fi