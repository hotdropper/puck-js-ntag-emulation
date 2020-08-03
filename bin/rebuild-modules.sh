#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT_DIR="${DIR}/.."
cd "$ROOT_DIR"
curl -L https://www.espruino.com/modules | awk '{ print $6 }' | grep href | sed "s/.*>\(.*\)<\/a.*/\1/" | grep -v ">Last" > /tmp/modules.list
cat /tmp/modules.list | sed "s/\(.*\)/curl https:\/\/www.espruino.com\/modules\/\1 > modules\/\1/" > /tmp/do.sh
rm -rf modules
sh /tmp/do.sh
rm /tmp/modules.list
rm /tmp/do.sh
