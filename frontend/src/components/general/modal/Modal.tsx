import { type ReactNode } from "react"
import { CloseButton, Dialog, Portal, type ConditionalValue } from "@chakra-ui/react"

interface ModalProps {
  readonly content: ReactNode | string;
  readonly verticalPlacement?: "top" | "center" | "bottom";
  readonly size?: ConditionalValue<"sm" | "md" | "lg" | "xl" | "xs" | "cover" | "full" | undefined>;
  readonly title: string;
  readonly footerContent?: ReactNode;
  readonly isOpen?: boolean;
  readonly onOpenChange: (e: { open: boolean }) => void;
}

export const Modal = (props: ModalProps) => {
  const { content, verticalPlacement = "center", footerContent, title, size = "md", isOpen, onOpenChange } = props;

  return (
    <Dialog.Root
      lazyMount
      open={isOpen}
      onOpenChange={onOpenChange}
      placement={verticalPlacement}
      size={size}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {content}
            </Dialog.Body>
            <Dialog.Footer>
              {footerContent}
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
