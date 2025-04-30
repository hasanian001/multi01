#!/bin/bash

# Generate Prisma client if needed
if [ ! -d "node_modules/.prisma" ]; then
  echo "Generating Prisma client..."
  npx prisma generate
fi

# Start NestJS server in development mode
nest start --watch