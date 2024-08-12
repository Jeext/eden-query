---
title: Setup Eden-React-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Setup Eden-React-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: Setup Eden-React-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: Setup Eden-React-Query - ElysiaJS
---

### 1. Install dependencies

```sh npm2yarn
npm install @trpc/server@next @trpc/client@next @trpc/react-query@next @tanstack/react-query@latest
```

### 2. Create Elysia server application

```twoslash include router
// @filename: server/router.ts
import { initTRPC } from '@trpc/server';
import { z } from "zod";
const t = initTRPC.create();

const appRouter = t.router({
  getUser: t.procedure.input(z.object({ id: z.string() })).query(() => ({ name: 'foo' })),
  createUser: t.procedure.input(z.object({ name: z.string() })).mutation(() => 'bar'),
});
export type AppRouter = typeof appRouter;
```

import ImportAppRouter from '../../partials/\_import-approuter.mdx';

<ImportAppRouter />

### 3. Create tRPC hooks

Create a set of strongly-typed React hooks from your `AppRouter` type signature with `createTRPCReact`.

```ts twoslash title='utils/trpc.ts'
// @include: router
// @filename: utils/trpc.ts
// ---cut---
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '../server/router'

export const trpc = createTRPCReact<AppRouter>()
```

### 4. Add tRPC providers

Create a tRPC client, and wrap your application in the tRPC Provider, as below. You will also need to set up and connect React Query, which [they document in more depth](https://tanstack.com/query/latest/docs/framework/react/quick-start).

:::tip
If you already use React Query in your application, you **should** re-use the `QueryClient` and `QueryClientProvider` you already have.
:::

```tsx title='App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import React, { useState } from 'react'
import { trpc } from './utils/trpc'

export function App() {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: 'http://localhost:3000/trpc',

          // You can pass any HTTP headers you wish here
          async headers() {
            return {
              authorization: getAuthCookie(),
            }
          },
        }),
      ],
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{/* Your app here */}</QueryClientProvider>
    </trpc.Provider>
  )
}
```

:::note
The reason for using `useState` in the creation of the `queryClient` and the `TRPCClient`, as opposed to declaring them outside of the component, is to ensure that each request gets a unique client when using SSR. If you use client side rendering then you can move them if you wish.
:::

#### 5. Fetch data

You can now use the tRPC React Query integration to call queries and mutations on your API.

```tsx twoslash title='pages/IndexPage.tsx'
// @include: router
// @filename: utils/trpc.ts
// ---cut---
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '../server/router'

export const trpc = createTRPCReact<AppRouter>()
// @filename: pages/IndexPage.tsx
import React from 'react'
// ---cut---
import { trpc } from '../utils/trpc'

export default function IndexPage() {
  const userQuery = trpc.getUser.useQuery({ id: 'id_bilbo' })
  const userCreator = trpc.createUser.useMutation()

  return (
    <div>
      <p>{userQuery.data?.name}</p>

      <button onClick={() => userCreator.mutate({ name: 'Frodo' })}>Create Frodo</button>
    </div>
  )
}
```