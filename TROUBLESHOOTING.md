# Troubleshooting Guide for Options-Technical Hybrid Strategy Scanner

This document provides solutions for common issues with the application.

## Issue: Unable to Start App

### Problem 1: Missing Dependencies
The application was missing the `next-themes` package which is required by the `components/ui/sonner.tsx` component.

**Solution:**
```bash
npm install next-themes
```

### Problem 2: Invalid CSS Directives
The `app/globals.css` file contained invalid CSS directives that are not supported:
- `@custom-variant dark (&:is(.dark *))`
- `@theme inline {}`

**Solution:**
Replace these non-standard directives with standard CSS. The first directive was removed, and the second was replaced with standard CSS variables in the `:root` selector.

### Problem 3: Build Cache Issues
There may be issues with the Next.js build cache.

**Solution:**
Clear the Next.js cache and rebuild:
```bash
rm -rf .next
npm run dev
```

Or use the new clean script:
```bash
npm run clean
```

## Additional Troubleshooting Steps

If you continue to experience issues:

1. **Full Clean Install:**
   ```bash
   rm -rf node_modules .next
   npm install
   npm run dev
   ```

2. **Check for JavaScript Errors:**
   Open the browser's Developer Tools (F12) and check the Console tab for any JavaScript errors.

3. **Verify Node.js Version:**
   Ensure you're using Node.js version 16.14 or higher:
   ```bash
   node -v
   ```

4. **Run Diagnostic Script:**
   ```bash
   node diagnostic.js
   ```

5. **Check Server Logs:**
   Look for errors in the terminal where you're running the Next.js server.

## Common Error Messages and Solutions

### "Module not found: Can't resolve 'next-themes'"
Install the missing package:
```bash
npm install next-themes
```

### "SyntaxError: unknown directive '@custom-variant'"
Remove or replace the invalid CSS directive in `app/globals.css`.

### "Error: EIO: i/o error, write"
This is often related to disk I/O or permission issues. Try:
- Check disk space
- Run with admin/sudo privileges
- Move the project to a different drive/location

### "Cannot find module '@radix-ui/react-*'"
Install the missing Radix UI component:
```bash
npm install @radix-ui/react-[component-name]
```