import { toaster } from "../../components/ui/helpers/getToaster";

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export const showToast = (
  description: string,
  variant: ToastVariant = 'error',
  title?: string
) => {
  toaster.create({
    title,
    description,
    type: variant,
    duration: 2000,
    closable: true,
  });
};
