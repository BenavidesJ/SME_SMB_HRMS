/* eslint-disable no-unused-vars */
import type { ReactNode } from "react";
import {
  useForm,
  FormProvider,
  type DefaultValues,
  type FieldValues,
} from "react-hook-form";

type SubmitResult = boolean | void;

interface FormProps<T extends FieldValues> {
  readonly children: ReactNode;
  readonly onSubmit: (data: T) => Promise<SubmitResult> | SubmitResult;
  readonly defaultValues?: DefaultValues<T>;
  readonly resetOnSuccess?: boolean;
}

export function Form<T extends FieldValues>({
  children,
  onSubmit,
  defaultValues,
  resetOnSuccess = false,
}: FormProps<T>) {
  const methods = useForm<T>({ defaultValues });

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={methods.handleSubmit(async (data) => {
          try {
            const result = await onSubmit(data);
            const success = result === undefined ? true : Boolean(result);

            if (resetOnSuccess && success) {
              methods.reset(defaultValues, {
                keepErrors: false,
                keepDirty: false,
                keepTouched: false,
                keepIsSubmitted: false,
                keepSubmitCount: false,
              });
            }
          } catch (e) {
            console.log(e);
          }
        })}
      >
        {children}
      </form>
    </FormProvider>
  );
}
