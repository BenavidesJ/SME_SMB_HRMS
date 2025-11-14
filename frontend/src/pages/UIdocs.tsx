import { Heading } from '@chakra-ui/react';
import { InputField } from '../components/forms';
import { Layout } from '../layouts';

function UIdocs() {
  return (
    <Layout>
      <Heading as="h1" size="2xl">
        Documentacion de Componentes
      </Heading>
      <InputField
        fieldType="number"
        label="Correo Electrónico"
        placeholder="Ingresa tu correo electrónico"
        helperText="test"
        required
      />
    </Layout>
  );
}

export default UIdocs;
