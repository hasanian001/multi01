#!/bin/bash

# Generate Prisma client
npx prisma generate

# Run seed script
npx ts-node prisma/seed.ts