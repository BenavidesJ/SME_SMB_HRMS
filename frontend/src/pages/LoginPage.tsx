import { Button, Card, Box, Stack } from '@chakra-ui/react'
import { Form, InputField } from '../components/forms'
import { useAuth } from '../context/AuthContext'
import type { Credentials } from '../types';
import { login } from '../services/api/auth';
import { useNavigate } from 'react-router';
import logo from "../assets/LogoColor.svg";
import { FiLogIn } from "react-icons/fi";
import { Link, Logo } from '../components/general';
import css from "../styles/global.module.css"

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
    <main className={css.mainFrame}>
      <Card.Root
        variant="elevated"
        flexDirection="row"
        borderRadius={{ base: "none", md: "4xl" }}
        maxW="850px"
        w="100%"
        h={{ base: "100%", md: "500px" }} >
        <Card.Body>
          <Stack
            direction={{ base: "column", md: "row" }}
          >
            <Box
              w={{ base: "100%", md: "40%" }}
              display="flex"
              justifyContent="center"
            >
              <Logo src={logo} width="300px" heigth="400px" />
            </Box>
            <Box w={{ base: "100%", md: "60%" }} p="8">
              <Card.Title fontSize="lg">
                Sistema de Gestion de Recursos Humanos - BioAlquimia.
              </Card.Title>
              <Card.Description mb="4" fontSize="lg">
                Ingresa tus datos para ingresar al sistema.
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
                  required
                  rules={{
                    required: "La contraseña es obligatoria",
                    minLength: { value: 6, message: "Mínimo 6 caracteres" },
                  }}
                />
                <Button
                  color="white"
                  fontWeight="bold"
                  backgroundColor="brand.blue.100"
                  loading={loading}
                  loadingText="Iniciando Sesion"
                  type='submit'
                  _hover={{ backgroundColor: "blue.600" }}
                  mt="4"
                  size="lg"
                  w="100%"
                  marginBottom="5"
                >
                  Iniciar Sesion <FiLogIn />
                </Button>
              </Form>
              <Link path="/forgot-password">¿Olvidaste la contraseña?</Link>
            </Box>
          </Stack>
        </Card.Body>
      </Card.Root>
    </main>
  )
}

export default LoginPage