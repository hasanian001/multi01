#!/bin/bash

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

echo "Schema has been updated in the database."