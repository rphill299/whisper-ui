# starts backend and ui simultaneously
# by passing "start" script (found in react-ui/package.json) to npm

#!/usr/bin/env bash
set -e

# Initialize conda in this shell
source "$(conda info --base)/etc/profile.d/conda.sh"

# Activate your env
conda activate whisper-ui

# Start the app
cd ./react-ui
npm start