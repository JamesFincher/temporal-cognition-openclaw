# Financial Suite Deployment

## Required Services

1. Create a Clerk application and enable email or OAuth sign-in.
2. Create a Convex deployment for this app.
3. In Clerk, add the Convex JWT template and copy the issuer domain.
4. In Convex, set `CLERK_JWT_ISSUER_DOMAIN` to the Clerk issuer domain.
5. In Vercel, set the public Clerk key, Clerk secret key, Convex URL, Convex deployment, and `OPENAI_API_KEY`.

## Local Validation

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

## Production Checklist

- Clerk development and production keys are not mixed.
- Convex auth config has been deployed after issuer changes.
- AI writes remain behind operation preview and explicit approval.
- Audit events avoid secrets, auth tokens, and account numbers.
