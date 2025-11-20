import { Button, Card, Stack, Image, Box, HStack } from '@chakra-ui/react'
import { Form, InputField } from '../components/forms'
import { useAuth } from '../context/AuthContext'
import type { Credentials } from '../types';
import { login } from '../services/api/auth';
import { useNavigate } from 'react-router';
import logo from "../assets/logo.jpg";
import { FiLogIn } from "react-icons/fi";

const LoginPage = () => {
  const nav = useNavigate();
  const { authenticate, loading } = useAuth();
  const handleLogin = async (credentials: Credentials) => {
    try {
      const response = await login(credentials);
      const { data: user } = response.data;
      const authUser = await authenticate(user);
      if (!authUser) return;
      nav("/");
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <HStack backgroundColor="gray.emphasized" h="100vh" display="flex" alignItems="center" justifyContent="center">
      <Card.Root variant="elevated" flexDirection="row" p="14">
        <Box alignContent="center">
          <Image src={logo} w="300px" />
        </Box>
        <Stack>
          <Card.Body>
            <Card.Title fontSize="lg">
              Sistema de Gestion de Recursos Humanos - BioAlquimia.
            </Card.Title>
            <Card.Description mb="4" fontSize="lg">
              Ingresa tus datos en el formulario para ingresar al sistema.
            </Card.Description>
            <Form onSubmit={handleLogin}>
              <InputField
                fieldType="text"
                label="Username"
                name="username"
                required
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
                required
                rules={{
                  required: "La contraseña es obligatoria",
                  minLength: { value: 6, message: "Mínimo 6 caracteres" },
                }}
              />
              <Button
                color="white"
                fontWeight="bold"
                backgroundColor="blue.600"
                loading={loading}
                loadingText="Iniciando Sesion"
                type='submit'
                mt="4"
                size="lg"
              >
                Iniciar Sesion <FiLogIn />
              </Button>
            </Form>
          </Card.Body>
        </Stack>
      </Card.Root>
    </HStack>
  )
}

export default LoginPage