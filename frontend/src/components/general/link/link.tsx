import { Link as ChakraLink } from "@chakra-ui/react"
import { Link as RouterLink } from 'react-router';

interface LinkProps {
  // La ruta hacia donde debe dirigirse el Link
  readonly path: string;
  // El contenido que tiene internamente el Link
  readonly children: React.ReactNode;
  // El color del texto del link
  readonly textColor?: string;
}

export const Link = ({ path, children, textColor, ...props }: LinkProps) => {
  return (
    <ChakraLink
      asChild
      color={textColor || "brand.blue.100"}
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
