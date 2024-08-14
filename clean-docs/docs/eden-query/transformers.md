---
title: Transformers Eden-Query - Elysia.js
head:
  - - meta
    - property: 'og:title'
      content: Transformers for Eden and Tanstack-Query integration.

  - - meta
    - name: 'description'
      content: >
        Transformers for Eden and Tanstack-Query integration.

  - - meta
    - property: 'og:description'
      content: >
        Transformers for Eden and Tanstack-Query integration.
---

# Transformers

> Refer to [tRPC's documentation on transformers](https://trpc.io/docs/server/data-transformers) for more in-depth information.

You are able to serialize the request body (for POST, PATCH, etc. requests) and response data for all requests.
The transformers need to be added both to the server and the client.

## Using [superjson](https://github.com/blitz-js/superjson)

SuperJSON allows us to transparently use primitives such as `Date`/`Map`/`Set`s between the server and client that
are not normally serializable with `JSON.stringify` and `JSON.parse`.

This means that you can send and receive this data without having to create your own encoding scheme.

::: tip
All response data can be serialized/deserialized by both the client and server.

Only request bodies can be serialized. This means that you should not send `Date`, `Map`, `Set`, etc.
within the request `query` or `params`, since these are sent as part of the URL.
:::

### Steps

#### 1. Install superjson

```sh npm2yarn
yarn add superjson
```

#### 2. Add the `transformPlugin` to your Elysia server application

::: code-group

```typescript twoslash include eq-transformers-application [server.ts]
import { Elysia, t } from 'elysia'
import { edenPlugin } from '@ap0nia/eden-react-query'
import SuperJSON from 'superjson'

const app = new Elysia()
  .use(edenPlugin({ transformer: SuperJSON }))
  .get('/a', () => 'A')
  .get('/b', () => 'B')

export type App = typeof app
```

:::

#### 3. Create a client with links, e.g. `httpLink()`, `httpBatchLink()`, etc

> TypeScript will guide you to where you need to add `transformer` as soon as you've added it your server application via the `transformPlugin` helper.

::: code-group

```typescript twoslash [index.ts]
// @filename: server.ts
// @include: eq-transformers-application

// @filename: index.ts
// ---cut---
import { createEdenTreatyReactQuery, httpLink } from '@ap0nia/eden-react-query'
import SuperJSON from 'superjson'
import type { App } from './server'

const eden = createEdenTreatyReactQuery<App>()

export const client = eden.createClient({
  links: [
    httpLink({
      domain: 'http://localhost:3000',
      transformer: SuperJSON,
    }),
  ],
})
```

:::

## Different transformers for upload and download

If a transformer should only be used for one direction or different transformers
should be used for upload and download (e.g., for performance reasons),
you can provide individual transformers for upload and download.
Make sure you use the same combined transformer everywhere.

### Steps

Here [superjson](https://github.com/blitz-js/superjson) is used for uploading and
[devalue](https://github.com/Rich-Harris/devalue) for downloading data because devalue
is a lot faster but insecure to use on the server.

#### 1. Install dependencies

```bash npm2yarn
yarn add superjson devalue
```

#### 2. Create the transformer

::: code-group

```typescript twoslash include eq-transformers-custom-transformer [transformer.ts]
import { uneval } from 'devalue'
import SuperJSON from 'superjson'
import type { DataTransformerOptions } from '@ap0nia/eden-react-query'

export const transformer: DataTransformerOptions = {
  input: SuperJSON,
  output: {
    serialize: (object) => uneval(object),
    // This `eval` only ever happens on the **client**
    deserialize: (object) => eval(`(${object})`),
  },
}
```

:::

#### 3. Add the transformer via the `transformPlugin` to your Elysia.js server application

::: code-group

```typescript twoslash [index.ts]
// @filename: transformer.ts
// @include: eq-transformers-custom-transformer

// @filename: index.ts
// ---cut---
import { createEdenTreatyReactQuery, httpLink } from '@ap0nia/eden-react-query'
import { transformer } from './transformer'

export const eden = createEdenTreatyReactQuery()

export const client = eden.createClient({
  links: [httpLink({ transformer })],
})
```

:::

## `DataTransformer` interface

```ts
export interface DataTransformer {
  serialize(object: any): any
  deserialize(object: any): any
}

interface InputDataTransformer extends DataTransformer {
  /**
   * This function runs **on the client** before sending the data to the server.
   */
  serialize(object: any): any
  /**
   * This function runs **on the server** to transform the data before it is passed to the resolver
   */
  deserialize(object: any): any
}

interface OutputDataTransformer extends DataTransformer {
  /**
   * This function runs **on the server** before sending the data to the client.
   */
  serialize(object: any): any
  /**
   * This function runs **only on the client** to transform the data sent from the server.
   */
  deserialize(object: any): any
}

export interface CombinedDataTransformer {
  /**
   * Specify how the data sent from the client to the server should be transformed.
   */
  input: InputDataTransformer
  /**
   * Specify how the data sent from the server to the client should be transformed.
   */
  output: OutputDataTransformer
}
```