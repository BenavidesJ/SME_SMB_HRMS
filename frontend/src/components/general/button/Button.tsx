import { Button as ChakraButton, type ButtonProps as ChakraButtonProps } from "@chakra-ui/react"
import { type ReactNode } from "react"
import { appearances, type ButtonAppearance } from "./appearances";

interface ButtonProps extends ChakraButtonProps {
  readonly children: ReactNode;
  readonly onClick?: () => void;
  readonly backgroundColor?: string;
  readonly appearance?: ButtonAppearance;
}

export const Button = ({ children, onClick, backgroundColor, appearance, ...rest }: ButtonProps) => {

  const buttonAppearance = appearances[appearance || "primary"]

  return (
    <ChakraButton
      onClick={onClick}
      color={buttonAppearance.color}
      backgroundColor={buttonAppearance.backgroundColor || backgroundColor}
      fontWeight={buttonAppearance.fontWeight}
      _hover={buttonAppearance._hover}
      {...rest}
    >
      {children}
    </ChakraButton>
  )
}
