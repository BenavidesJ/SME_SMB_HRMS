import {
  Avatar,
  Card,
  Grid,
  GridItem,
  Heading,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Layout } from "../../../components/layout/Layout";
import { Button } from "../../../components/general/button/Button";
import { Form, InputField } from "../../../components/forms";
import { useAuth } from "../../../context/AuthContext";
import { useApiQuery } from "../../../hooks/useApiQuery";
import type { EmployeeRow } from "../../../types";

const Perfil = () => {
  const { user } = useAuth();
  const employeeId = user?.id

  const { data: employee, isLoading } = useApiQuery<EmployeeRow>({
    url: employeeId ? `/empleados/${employeeId}` : "",
    enabled: Boolean(employeeId),
  });

  const fullName = employee
    ? `${employee.nombre} ${employee.primer_apellido} ${employee.segundo_apellido}`.trim()
    : user?.nombre ?? "Usuario";

  const InfoBlock = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) => (
    <Stack gap="0.5">
      <Text textStyle="xs" color="fg.muted" textTransform="uppercase">
        {label}
      </Text>
      <Text fontWeight="semibold">{value ?? "—"}</Text>
    </Stack>
  );

  return (
    <Layout pageTitle="Perfil de Usuario">
      <Stack gap="8">
        <Card.Root>
          <Card.Body>
            <Stack
              direction={{ base: "column", md: "row" }}
              align="center"
              gap="6"
            >
              <Avatar.Root size="2xl">
                <Avatar.Fallback name={fullName} />
              </Avatar.Root>

              <Stack align={{ base: "center", md: "flex-start" }} gap="2">
                <Heading size="lg">{fullName}</Heading>
                <Text color="fg.muted">
                  {employee?.fecha_ingreso}
                </Text>
                <Text color="fg.muted">
                  {employee?.usuario?.username ?? user?.usuario?.username ?? "Sin usuario"}
                </Text>
                <Text color="fg.muted">
                  {employee?.correo_electronico ?? user?.correo_electronico ?? "Sin correo"}
                </Text>
              </Stack>
            </Stack>
          </Card.Body>
        </Card.Root>

        {isLoading ? (
          <Stack align="center" py="10">
            <Spinner size="lg" />
          </Stack>
        ) : (
          <Grid
            templateColumns={{
              base: "1fr",
              md: "repeat(2, 1fr)",
            }}
            gap="6"
          >
            <GridItem colSpan={1}>
              <Card.Root>
                <Card.Header>
                  <Card.Title>Información personal</Card.Title>
                </Card.Header>
                <Card.Body>
                  <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
                    <InfoBlock label="Nombre" value={user?.nombre} />
                    <InfoBlock
                      label="Primer apellido"
                      value={user?.primer_apellido}
                    />
                    <InfoBlock
                      label="Segundo apellido"
                      value={user?.segundo_apellido}
                    />
                    <InfoBlock
                      label="Identificación"
                      value={user?.identificacion}
                    />
                    <InfoBlock
                      label="Estado civil"
                      value={employee?.estado_civil?.nombre ?? user?.estado_civil?.nombre}
                    />
                    <InfoBlock
                      label="Fecha de nacimiento"
                      value={user?.fecha_nacimiento}
                    />
                  </SimpleGrid>
                </Card.Body>
              </Card.Root>
            </GridItem>

            <GridItem colSpan={1}>
              <Card.Root>
                <Card.Header>
                  <Card.Title>Seguridad</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Text color="fg.muted" mb="4">
                    Cambiar contraseña
                  </Text>
                  <Form
                    onSubmit={() => console.log("hello")}
                    defaultValues={{
                      password: "",
                    }}
                  >
                    <InputField
                      fieldType="password"
                      label="Nueva contraseña"
                      name="password"
                      noIndicator
                      rules={{
                        minLength: { value: 6, message: "Mínimo 6 caracteres" },
                      }}
                    />
                    <Button
                      loadingText="Enviando"
                      appearance="login"
                      type="submit"
                      mt="4"
                      size="lg"
                    >
                      Guardar
                    </Button>
                  </Form>
                </Card.Body>
              </Card.Root>
            </GridItem>
          </Grid>
        )}
      </Stack>
    </Layout>
  );
};

export default Perfil;