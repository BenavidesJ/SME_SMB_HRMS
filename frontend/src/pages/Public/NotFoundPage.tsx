import { useLocation, useNavigate } from "react-router";
import { Button, Heading, Image, Text } from "@chakra-ui/react";
import { FiArrowLeft } from "react-icons/fi";
import notFound from "../../assets/notFound.svg";
import css from "../../styles/global.module.css";


const NotFoundPage = () => {
  const location = useLocation();
  const nav = useNavigate()

  const returnPath =
    (location.state as { from?: string })?.from ?? "/";

  const handleNavigation = () => {
    nav(returnPath, { replace: true });
  }

  return (
    <main className={css.notFound}>
      <div>
        <Image src={notFound} width="300px" height="300px" />
        <Heading as="h2" size="5xl">
          404 - ¡Lo sentimos!
          <span style={{ color: "var(--brand-green-100)" }}> Página</span> <span style={{ color: "var(--brand-blue-100)" }}>no encontrada.</span>
        </Heading>
        <Text fontSize="3xl" fontWeight="normal" mb={3}>
          La página que estas buscando puede haber sido removida, su nombre ha cambiado o esta temporalmente deshabilitada.
        </Text>
        <Button
          size="2xl"
          fontSize="2xl"
          borderRadius="4xl"
          backgroundColor="brand.blue.100"
          onClick={handleNavigation}
          _hover={{ backgroundColor: "brand.blue.600" }}
        >
          <FiArrowLeft /> Volver a la página anterior
        </Button>
      </div>
    </main>
  );
};

export default NotFoundPage;