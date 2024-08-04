import { httpBatchLink } from '@elysiajs/eden-react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { createBrowserRouter, Link, Outlet, RouterProvider } from 'react-router-dom'
import SuperJSON from 'superjson'

import { eden } from './lib/eden'
import HomePage from './routes/+page'
import AbortPage from './routes/abort/+page'
import BatchPage from './routes/batch/+page'
import HelloPreloadPage, { load as helloPreloadLoader } from './routes/hello-preload/+page'
import MutationPage from './routes/mutation/+page'

export function App() {
  const [queryClient] = useState(() => new QueryClient())

  const [client] = useState(() => {
    return eden.createClient({
      links: [
        httpBatchLink({
          endpoint: '/api/batch',
          transformer: SuperJSON,
          domain: 'http://localhost:3000',
        }),
      ],
    })
  })

  const [utils] = useState(() => {
    /**
     * Raw context that's __not__ connected to React's context system.
     */
    const context = eden.createContext({ queryClient, client })

    /**
     * Use the context object to create utilities that act on the same queryClient and edenClient.
     * This can be provided to load functions that run before context is rendered by React.
     */
    return eden.createUtils(context)
  })

  const [router] = useState(() => {
    return createBrowserRouter([
      {
        element: (
          <>
            <header>
              <nav>
                <ul>
                  <li>
                    <Link to="/">home</Link>
                  </li>
                  <li>
                    <Link to="/hello-preload">hello with preloading</Link>
                  </li>
                  <li style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    {/* This is a single-page application with Vite, no SSR */}
                    hello with ssr
                  </li>
                  <li>
                    <Link to="/batch">batch</Link>
                  </li>
                  <li>
                    <Link to="/mutation">mutation example with todos</Link>
                  </li>
                  <li>
                    <Link to="/reactive-input">reactive input box</Link>
                  </li>
                  <li>
                    <Link to="/abort">abort</Link>
                  </li>
                </ul>
              </nav>
            </header>

            <Outlet />
          </>
        ),
        children: [
          {
            path: '/',
            element: <HomePage />,
          },
          {
            path: '/hello-preload',
            element: <HelloPreloadPage />,
            loader: helloPreloadLoader(utils),
          },
          {
            path: '/batch',
            element: <BatchPage />,
          },
          {
            path: '/mutation',
            element: <MutationPage />,
          },
          {
            path: '/abort',
            element: <AbortPage />,
          },
        ],
      },
    ])
  })

  return (
    <eden.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </eden.Provider>
  )
}
