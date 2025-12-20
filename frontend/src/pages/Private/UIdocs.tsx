import { Button, Stack } from '@chakra-ui/react';
import { Form, InputField } from '../../components/forms';
import { Layout } from '../../layouts';
import { login } from '../../services/api/auth';


function UIdocs() {

  const onSubmit = async (data: any) => { await login(data) }
  return (
    <Layout pageTitle="Documentación de Componentes">
      <Stack>
        <Form onSubmit={onSubmit}>
          <InputField
            fieldType="text"
            label="Username"
            name="username"
            placeholder="Ingresa tu username electrónico"
            helperText="test"
            rules={{
              required: "El usuario es obligatorio",
              minLength: { value: 3, message: "Debe tener al menos 3 caracteres" }
            }}
          />
          <InputField
            fieldType="password"
            label="Password"
            name="password"
            placeholder='password'
            helperText="test2"
            rules={{
              minLength: { value: 6, message: "Mínimo 6 caracteres" },
            }}
          />
          <Button type='submit'>Enviar</Button>
        </Form>
      </Stack>
    </Layout>
  );
}

export default UIdocs;
