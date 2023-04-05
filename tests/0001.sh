#!/usr/bin/env bash

cd $1
echo $(pwd);

make $2

if [ "$2" = "all" ]; then
    echo "放置跟编译相关的测试脚本"
elif [ "$2" = "run" ]; then
    echo "放置跟运行相关的测试脚本"
fi
