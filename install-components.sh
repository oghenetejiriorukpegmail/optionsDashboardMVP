#!/bin/bash

# Install missing shadcn/ui components
echo "Installing missing shadcn/ui components..."

# Using npx shadcn to add/update components
npx shadcn add separator --yes
npx shadcn add badge --yes
npx shadcn add button --yes
npx shadcn add card --yes
npx shadcn add toast --yes
npx shadcn add tabs --yes
npx shadcn add label --yes
npx shadcn add slider --yes
npx shadcn add input --yes
npx shadcn add switch --yes
npx shadcn add sonner --yes
npx shadcn add alert --yes

echo "Installation complete!"
