import { ChakraProvider } from '@chakra-ui/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { Toaster } from './components/ui/toaster';
import { router } from './router';
import { AuthProvider } from './context/AuthContext';
import "./styles/colors.css";
import { system } from './styles/theme';

document.title = 'BioAlquimia';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </ChakraProvider>
  </StrictMode>
);
