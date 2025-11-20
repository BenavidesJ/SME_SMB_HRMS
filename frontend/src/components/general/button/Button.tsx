import { Button as ChakraButton } from "@chakra-ui/react"
import type { ReactNode } from "react"

interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  backgroundColor: string;
}

export const Button = ({ children, onClick, backgroundColor, ...rest }: ButtonProps) => {
  return (
    <ChakraButton
      onClick={onClick}
      backgroundColor={backgroundColor}
      {...rest}
    >
      {children}
    </ChakraButton>
  )
}
