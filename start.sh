#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$SCRIPT_DIR/api" && npm run start:dev &
cd "$SCRIPT_DIR/app" && EXPO_OFFLINE=1 EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 npx expo start --web --port 5001 --offline &

sleep 2
node "$SCRIPT_DIR/proxy-server.js"
