# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## UI Components

Use the existing UI components from `/src/components/` instead of creating new ones. `Primitives.tsx` contains reusable styled components (headings, paragraphs, lists, stacks, etc.) and `CodeBlock/` contains a syntax-highlighted code block component. Both are already configured with the theme system.