#!/usr/bin/env bash

PRJ_DIR=$(cd $(dirname $0); pwd)

DATE=`date +%Y-%m-%d\ %H:%M:%S`

if [ ! -d $PRJ_DIR/db ]; then
mkdir $PRJ_DIR/db
cat > $PRJ_DIR/db/problem.json <<EOF
[
    {
        "id": "11111111",
        "problemName": "Hello World",
        "problemNo": "0001",
        "problemDiff": "简单",
        "problemLang": "C",
        "problemTags": "程序设计",
        "problemDate": "$DATE"
    }
]
EOF
cat > $PRJ_DIR/db/submit.json <<EOF
[
]
EOF
cat > $PRJ_DIR/db/user.json <<EOF
[
    {
        "id": "00000000",
        "userName": "管理员",
        "userAccount": "root",
        "userPassword": "root",
        "userType": "管理员",
        "userDate": "$DATE"
    }
]
EOF
fi
