import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { RouterProvider } from '@tanstack/react-router';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/sonner';
import { persister, queryClient } from './lib/query-client';
import { router } from './router';

function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: Number.POSITIVE_INFINITY }}
    >
      <ThemeProvider defaultTheme="system" storageKey="theme">
        <Toaster richColors />
        <RouterProvider router={router} />
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}

export default App;
