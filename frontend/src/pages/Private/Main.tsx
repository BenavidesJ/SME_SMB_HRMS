import { Logo, Modal } from "../../components/general";
import { Layout } from "../../layouts";
import logo from "../../assets/LogoColor.svg";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { Button, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router";


const Main = () => {
  const { user } = useAuth();
  const [openModal, setOpenModal] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const userReqNewPassword = user?.usuario.requiere_cambio_contrasena || false;

    if (userReqNewPassword) {
      setOpenModal(true);
    }

  }, [user]);

  return (
    <Layout pageTitle="Página Principal">
      <Logo src={logo} width="500px" heigth="500px" />
      <Logo src={logo} width="500px" heigth="500px" />
      <Logo src={logo} width="500px" heigth="500px" />
      <Logo src={logo} width="500px" heigth="500px" />
      <Logo src={logo} width="500px" heigth="500px" />
      <Logo src={logo} width="500px" heigth="500px" />
      <Logo src={logo} width="500px" heigth="500px" />
      <Logo src={logo} width="500px" heigth="500px" />
      <Logo src={logo} width="500px" heigth="500px" />
      <Logo src={logo} width="500px" heigth="500px" />
      <Modal
        title="Cambia tu contraseña"
        isOpen={openModal}
        onOpenChange={(e) => setOpenModal(e.open)}
        content={
          <Text textStyle="md">
            Recuerda cambiar tu contraseña por seguridad. ¿Quieres hacerlo ahora?
          </Text>
        }
        footerContent={
          <>
            <Button
              color="brand.blue.100"
              fontWeight="semibold"
              backgroundColor="brand.green.100"
              onClick={() => setOpenModal(false)}
            >
              Lo haré más tarde
            </Button>
            <Button
              color="white"
              backgroundColor="brand.blue.100"
              onClick={() => nav("perfil", { replace: true })}
            >
              Ir al Perfil
            </Button>
          </>
        }
      />
    </Layout>
  )
}

export default Main