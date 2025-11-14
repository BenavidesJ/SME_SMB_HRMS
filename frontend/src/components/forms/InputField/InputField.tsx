import { Badge, Field, Input, NumberInput } from '@chakra-ui/react';
import { forwardRef } from 'react';
import { PasswordInput } from '../../ui/password-input';

type FieldType = 'text' | 'password' | 'email' | 'number';

// tipos: Password, Texto, Numeros
interface FieldProps {
  /*
  El tipo del campo input. Por defecto text.
  */
  fieldType: FieldType;
  /*
 El label del campo input.
 */
  label: React.ReactNode | string;
  /*
El placeholder del campo input.
*/
  placeholder: string;
  /*
El texto de instrucciones o ayuda del campo input.
*/
  helperText?: React.ReactNode | string;
  /*
El mensaje de error del campo input.
*/
  errorText?: React.ReactNode | string;
  /*
Indica si el campo es requerido.
*/
  required?: boolean;
}

type InputProps = Pick<FieldProps, 'placeholder' | 'required'>;

const TextField = ({ placeholder, required }: InputProps) => {
  return <Input placeholder={placeholder} required={required} />;
};

const PasswordField = ({ placeholder, required }: InputProps) => {
  return <PasswordInput placeholder={placeholder} required={required} />;
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
    const { fieldType, label, helperText, required, placeholder } = props;

    const typeMap: Record<
      FieldType,
      React.FC<{ placeholder: string; required?: boolean }>
    > = {
      text: TextField,
      password: PasswordField,
      email: TextField,
      number: NumberField,
    };

    const Component = typeMap[fieldType] ?? TextField;

    return (
      <Field.Root minW="300px" ref={ref}>
        <Field.Label>
          {label}
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
        </Field.Label>
        <Component placeholder={placeholder} required={required} />
        <Field.HelperText>{helperText}</Field.HelperText>
      </Field.Root>
    );
  }
);
