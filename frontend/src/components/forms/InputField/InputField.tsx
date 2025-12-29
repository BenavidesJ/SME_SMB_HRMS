import { Badge, Field, Input, NumberInput, type InputProps } from '@chakra-ui/react';
import { forwardRef } from 'react';
import { PasswordInput } from '../../ui/password-input';
import { useFormContext, type RegisterOptions } from 'react-hook-form';

type FieldType = 'text' | 'password' | 'email' | 'number';

// tipos: Password, Texto, Numeros
interface FieldProps extends InputProps {
  /*
  El tipo del campo input. Por defecto text.
  */
  fieldType: FieldType;
  /*
  El label del campo input.
  */
  label?: string;
  /*
  El nombre del campo input.
  */
  name: string;
  /*
  El placeholder del campo input.
  */
  placeholder?: string;
  /*
  El texto de instrucciones o ayuda del campo input.
  */
  helperText?: React.ReactNode | string;
  /*
  Indica si el campo es requerido.
  */
  required?: boolean;
  /*
  Indica si mostrar el indicador.
  */
  noIndicator?: boolean;
  /*
  Reglas de validacion.
  */
  rules?: RegisterOptions;
}

const TextField = ({ ...props }: Omit<FieldProps, "fieldType">) => {
  return <Input {...props} />;
};

const PasswordField = ({ ...props }: Omit<FieldProps, "fieldType">) => {
  return <PasswordInput {...props} />;
};

const NumberField = () => {
  return (
    <NumberInput.Root>
      <NumberInput.Control>
        <NumberInput.IncrementTrigger />
        <NumberInput.DecrementTrigger />
      </NumberInput.Control>
      <NumberInput.Input />
    </NumberInput.Root>
  );
};

export const InputField = forwardRef<HTMLDivElement, FieldProps>(
  function InputField(props, ref) {
    const { name, fieldType, label, helperText, required, placeholder, rules, noIndicator = false } = props;
    const {
      register,
      formState: { errors },
    } = useFormContext();

    const error = errors[name]?.message as string | undefined;
    const isInvalid = Boolean(error);

    const Component = {
      text: TextField,
      email: TextField,
      password: PasswordField,
      number: NumberField,
    }[fieldType];


    return (
      <Field.Root minW="300px" ref={ref} required={required} invalid={isInvalid} minH="90px">
        <Field.Label>
          {label}
          {!noIndicator && (
            <>
              {required ? (
                <Field.RequiredIndicator />
              ) : (
                <Field.RequiredIndicator
                  fallback={
                    <Badge size="sm" variant="subtle">
                      Opcional
                    </Badge>
                  }
                />
              )}
            </>
          )}
        </Field.Label>
        <Component
          label={label}
          placeholder={placeholder}
          required={required}
          {...register(name, { required, ...rules })}
          _focus={{ outlineColor: !isInvalid ? "blue.600" : "red.600" }}
        />
        {error ? <Field.ErrorText>{error}</Field.ErrorText> : <Field.HelperText fontSize="medium">{helperText}</Field.HelperText>}
      </Field.Root>
    );
  }
);

