import { Card, Grid, GridItem, Text } from "@chakra-ui/react";
import { Layout } from "../../../layouts";
import { Button } from "../../../components/general/button/Button";
import { Form, InputField } from "../../../components/forms";
import { useAuth } from "../../../context/AuthContext";

const Perfil = () => {
  const { user } = useAuth();
  return (
    <Layout pageTitle="Perfil de Usuario">
      <div>
        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(2, 1fr)"
          }}
          gap="6"
        >
          <GridItem colSpan={1}>
            <Card.Root>
              <Card.Header>
                <Card.Title>Personal</Card.Title>
              </Card.Header>
              <Card.Body />
              <Card.Footer />
            </Card.Root>
          </GridItem>
          <GridItem colSpan={1}>
            <Card.Root>
              <Card.Header>
                <Card.Title>Seguridad</Card.Title>
              </Card.Header>
              <Card.Body>
                <Text>Cambiar la contraseña</Text>
                <Form onSubmit={() => console.log("hello")} defaultValues={{ password: user?.usuario.username }}>
                  <InputField
                    fieldType="password"
                    name="password"
                    noIndicator
                    rules={{
                      minLength: { value: 6, message: "Mínimo 6 caracteres" },
                    }}
                  />
                  <Button
                    // loading={loading}
                    loadingText="Enviando"
                    appearance="login"
                    type='submit'
                    mt="4"
                    size="lg"
                    marginBottom="5"
                  >
                    Enviar
                  </Button>
                </Form>
              </Card.Body>
            </Card.Root>
          </GridItem>
          <GridItem colSpan={2}>
            <Card.Root>
              <Card.Header>
                <Card.Title>Perfil Profesional</Card.Title>
              </Card.Header>
              <Card.Body />
              <Card.Footer />
            </Card.Root>
          </GridItem>
        </Grid>
      </div>
    </Layout>
  )
}

export default Perfil;