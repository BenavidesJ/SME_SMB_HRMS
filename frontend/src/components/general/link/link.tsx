import { Link as ChakraLink } from "@chakra-ui/react"
import { Link as RouterLink } from 'react-router';

interface LinkProps {
  // La ruta hacia donde debe dirigirse el Link
  readonly path: string;
  // El contenido que tiene internamente el Link
  readonly children: React.ReactNode;
}

export const Link = ({ path, children, ...props }: LinkProps) => {
  return (
    <ChakraLink
      asChild
      color="#5185D6"
      {...props}
    >
      <RouterLink
        to={path}
      >
        {children}
      </RouterLink>
    </ChakraLink>
  )
}
