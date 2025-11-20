import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { Toaster } from './components/ui/toaster';
import { router } from './router';
import { AuthProvider } from './context/AuthContext';

document.title = 'BioAlquimia';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={defaultSystem}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </ChakraProvider>
  </StrictMode>
);
