import { useState } from 'react';
import { Button, Card, Stack, Image, Box } from '@chakra-ui/react'
import { Form, InputField } from '../components/forms'
import type { Credentials } from '../types';
import { restorePassword } from '../services/api/auth';
import { useNavigate } from 'react-router';
import logo from "../assets/LogoColor.svg";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from '../components/general';
import css from "../styles/global.module.css";

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handleResetPassword = async (credentials: Pick<Credentials, "username">) => {
    try {
      setLoading(true);
      await restorePassword(credentials);
      nav("/login");
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false);
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
              <Image src={logo} w="300px" h="400px" />
            </Box>
            <Box w={{ base: "100%", md: "60%" }} p="8">
              <Card.Title fontSize="lg">
                Sistema de Gestion de Recursos Humanos - BioAlquimia.
              </Card.Title>
              <Card.Description mb="4" fontSize="lg">
                Ingresa tus datos para recuperar tu contraseña.
              </Card.Description>
              <Form onSubmit={handleResetPassword}>
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
                  Recuperar Contraseña
                </Button>
              </Form>
              <Link path="/login"><FiArrowLeft />Volver al login</Link>
            </Box>
          </Stack>
        </Card.Body>
      </Card.Root>
    </main>
  )
}

export default ForgotPasswordPage