import { toaster } from '../../components/ui/toaster';

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
    duration: 2500,
    closable: true,
  });
};
