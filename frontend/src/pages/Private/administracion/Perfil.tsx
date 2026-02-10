import { useMemo } from "react";
import {
  Avatar,
  Badge,
  Card,
  Grid,
  GridItem,
  Heading,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "react-router";
import { FiExternalLink } from "react-icons/fi";
import { Layout } from "../../../components/layout/Layout";
import { Button } from "../../../components/general/button/Button";
import { Form, InputField } from "../../../components/forms";
import { useAuth } from "../../../context/AuthContext";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { changePassword } from "../../../services/api/auth";
import type { Contrato, EmployeeRow } from "../../../types";

interface PasswordFormValues {
  password_anterior: string;
  password_nuevo: string;
  confirmar_password: string;
}

const Perfil = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const employeeId = user?.id;

  const isAdmin = ["ADMINISTRADOR", "SUPER_ADMIN"].includes(
    user?.usuario?.rol ?? ""
  );

  const { data: employee, isLoading } = useApiQuery<EmployeeRow>({
    url: employeeId ? `/empleados/${employeeId}` : "",
    enabled: Boolean(employeeId),
  });

  const { data: contratos } = useApiQuery<Contrato[]>({
    url: employeeId ? `/empleados/${employeeId}/contratos` : "",
    enabled: Boolean(employeeId) && !isAdmin,
  });

  const activeContract = useMemo(() => {
    if (!contratos?.length) return null;
    return (
      contratos.find((c) => c.estado === "ACTIVO") ??
      contratos[0]
    );
  }, [contratos]);

  const fullName = employee
    ? `${employee.nombre} ${employee.primer_apellido} ${employee.segundo_apellido}`.trim()
    : user?.nombre ?? "Usuario";

  const handleChangePassword = async (data: PasswordFormValues) => {
    if (data.password_nuevo !== data.confirmar_password) {
      throw new Error("Las contraseñas no coinciden.");
    }

    await changePassword({
      password_anterior: data.password_anterior,
      password_nuevo: data.password_nuevo,
    });
  };

  const formatCurrency = (value: string | number | null | undefined) => {
    if (value == null) return "—";
    return Number(value).toLocaleString("es-CR", {
      style: "currency",
      currency: "CRC",
      minimumFractionDigits: 2,
    });
  };

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
        {/* ── Header ── */}
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
                  {employee?.usuario?.username ??
                    user?.usuario?.username ??
                    "Sin usuario"}
                </Text>
                <Text color="fg.muted">
                  {employee?.correo_electronico ??
                    user?.correo_electronico ??
                    "Sin correo"}
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
            {/* ── Información personal ── */}
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
                      value={
                        employee?.estado_civil?.nombre ??
                        user?.estado_civil?.nombre
                      }
                    />
                    <InfoBlock
                      label="Fecha de nacimiento"
                      value={user?.fecha_nacimiento}
                    />
                  </SimpleGrid>
                </Card.Body>
              </Card.Root>
            </GridItem>

            {/* ── Seguridad – Cambio de contraseña ── */}
            <GridItem colSpan={1}>
              <Card.Root>
                <Card.Header>
                  <Card.Title>Seguridad</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Text color="fg.muted" mb="4">
                    Cambiar contraseña
                  </Text>
                  <Form<PasswordFormValues>
                    onSubmit={handleChangePassword}
                    resetOnSuccess
                    defaultValues={{
                      password_anterior: "",
                      password_nuevo: "",
                      confirmar_password: "",
                    }}
                  >
                    <InputField
                      fieldType="password"
                      label="Contraseña actual"
                      name="password_anterior"
                      noIndicator
                      rules={{
                        required: "Ingrese su contraseña actual",
                      }}
                    />
                    <InputField
                      fieldType="password"
                      label="Nueva contraseña"
                      name="password_nuevo"
                      noIndicator
                      rules={{
                        required: "Ingrese la nueva contraseña",
                        minLength: {
                          value: 6,
                          message: "Mínimo 6 caracteres",
                        },
                      }}
                    />
                    <InputField
                      fieldType="password"
                      label="Confirmar nueva contraseña"
                      name="confirmar_password"
                      noIndicator
                      rules={{
                        required: "Confirme la nueva contraseña",
                        minLength: {
                          value: 6,
                          message: "Mínimo 6 caracteres",
                        },
                      }}
                    />
                    <Button
                      loadingText="Guardando"
                      appearance="primary"
                      type="submit"
                      mt="4"
                      size="lg"
                      w="full"
                    >
                      Guardar contraseña
                    </Button>
                  </Form>
                </Card.Body>
              </Card.Root>
            </GridItem>

            {/* ── Información contractual (solo EMPLEADO) ── */}
            {!isAdmin && activeContract && (
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <Card.Root>
                  <Card.Header>
                    <Stack
                      direction="row"
                      align="center"
                      justify="space-between"
                    >
                      <Card.Title>Información contractual</Card.Title>
                      <Badge
                        colorPalette={
                          activeContract.estado === "ACTIVO" ? "green" : "gray"
                        }
                      >
                        {activeContract.estado ?? "Sin estado"}
                      </Badge>
                    </Stack>
                  </Card.Header>
                  <Card.Body>
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap="4">
                      <InfoBlock
                        label="Puesto"
                        value={activeContract.puesto}
                      />
                      <InfoBlock
                        label="Tipo de contrato"
                        value={activeContract.tipo_contrato}
                      />
                      <InfoBlock
                        label="Tipo de jornada"
                        value={activeContract.tipo_jornada}
                      />
                      <InfoBlock
                        label="Salario base"
                        value={formatCurrency(activeContract.salario_base)}
                      />
                      <InfoBlock
                        label="Horas semanales"
                        value={activeContract.horas_semanales}
                      />
                      <InfoBlock
                        label="Fecha de inicio"
                        value={activeContract.fecha_inicio}
                      />
                    </SimpleGrid>
                  </Card.Body>
                </Card.Root>
              </GridItem>
            )}

            {/* ── Link a gestión de colaborador (ADMINISTRADOR / SUPER_ADMIN) ── */}
            {isAdmin && employeeId && (
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <Card.Root>
                  <Card.Header>
                    <Card.Title>Información contractual</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <Text color="fg.muted" mb="4">
                      Como administrador, podés ver y editar tu información
                      contractual completa desde el módulo de mantenimientos.
                    </Text>
                    <Button
                      appearance="primary"
                      onClick={() =>
                        navigate(
                          `/mantenimientos-consultas/colaboradores/${employeeId}`
                        )
                      }
                    >
                      Ver información contractual
                      <FiExternalLink />
                    </Button>
                  </Card.Body>
                </Card.Root>
              </GridItem>
            )}
          </Grid>
        )}
      </Stack>
    </Layout>
  );
};

export default Perfil;