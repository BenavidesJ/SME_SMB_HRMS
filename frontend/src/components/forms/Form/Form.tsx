import type { ReactNode } from "react";
import { useForm, FormProvider, type FieldValues, type DefaultValues, type SubmitHandler } from "react-hook-form";


interface FormProps<T extends FieldValues> {
  /*
   * Los inputs del formulario.
   */
  readonly children: ReactNode;
  /*
   * El método para enviar datos al servidor.
   */
  readonly onSubmit: SubmitHandler<T>
  /*
   * Los valores por defecto.
   */
  readonly defaultValues?: DefaultValues<T>
}

export function Form<T extends FieldValues>({ children, onSubmit, defaultValues }: FormProps<T>) {
  const methods = useForm<T>({ defaultValues });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        {children}
      </form>
    </FormProvider>
  );
}
