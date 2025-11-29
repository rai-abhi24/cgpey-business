This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## User vs Merchant accounts

Login identities now live in the `User` collection:

- `userId` is the public identifier (`usr_*`)
- `role` is either `ADMIN` or `MERCHANT`
- Merchant operators have `merchantId` populated; admins leave it `null`
- Contact details (`email`, `phone`) and `lastLoginAt` now belong to the user record

Business profile and API credentials continue to reside on `Merchant`.

### Migrating existing merchants

Run the helper script to backfill `User` rows for every merchant:

```bash
npx ts-node scripts/migrate-merchants-to-users.ts
```

The script is idempotent (skips merchants that already have a linked user) and copies the merchant’s email/phone, sets the role to `MERCHANT`, and preserves the merchant’s active flag.

For admin operators, create rows manually with `role: 'ADMIN'` and no `merchantId`. Once a user exists you can continue using the OTP login flow without any additional changes.
