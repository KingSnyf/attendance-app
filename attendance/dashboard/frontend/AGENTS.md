<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Breaking Changes (Next.js 16) — Already verified

- `params` prop is now async (must `await` in Server Components, use `use()` in Client Components)
- `searchParams` prop is now async
- `cookies()` and `headers()` are now async
- `Image` `priority` → `preload` (v16)
- `images.qualities` config REQUIRED in `next.config.ts` (already set to `[75]`)
- `useSearchParams()` requires `<Suspense>` boundary
<!-- END:nextjs-agent-rules -->
