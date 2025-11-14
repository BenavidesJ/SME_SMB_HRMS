import type { ReactNode } from "react";
import { useForm, FormProvider, type FieldValues, type DefaultValues, type SubmitHandler } from "react-hook-form";


interface FormProps {
  /*
   * Los inputs del formulario.
   */
  readonly children: ReactNode;
  /*
   * El método para enviar datos al servidor.
   */
  readonly onSubmit: SubmitHandler<FieldValues>
  /*
   * Los valores por defecto.
   */
  readonly defaultValues?: DefaultValues<FieldValues>
}

export function Form({ children, onSubmit, defaultValues }: FormProps) {
  const methods = useForm({ defaultValues });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        {children}
      </form>
    </FormProvider>
  );
}
