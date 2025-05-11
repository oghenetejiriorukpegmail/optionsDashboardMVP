// This script converts Next.js syntax to Nuxt syntax in the risk-management pages

const fs = require('fs');
const path = require('path');

// Define source and destination paths
const nextAppPath = '/home/admin/optionsDashboardMVP/app/risk-management';
const nuxtPagesPath = '/home/admin/optionsDashboardMVP/pages/risk-management';

// Create destination directory if it doesn't exist
fs.mkdirSync(nuxtPagesPath, { recursive: true });

// Convert page.tsx to Nuxt format
const pageContent = fs.readFileSync(path.join(nextAppPath, 'page.tsx'), 'utf8');

// Replace imports
let nuxtContent = pageContent
  .replace(/@\/components\//g, '~/components/')
  .replace(/"use client";\n\n/, '')
  .replace(/import { toast } from "sonner";/, 'import { useToast } from "~/composables/useToast";');

// Write converted file
fs.writeFileSync(path.join(nuxtPagesPath, 'index.vue'), `<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Risk Management</h1>
      <p class="text-muted-foreground">
        Protect capital with disciplined risk management rules
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Risk Management Tools</CardTitle>
        <CardDescription>
          Simplified risk management tools for debugging
        </CardDescription>
      </CardHeader>
      <CardContent>
        Simplified risk management content for debugging
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
</script>
`);

console.log('Conversion complete!');