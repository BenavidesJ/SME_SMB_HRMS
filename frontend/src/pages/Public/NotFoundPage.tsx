import { useNavigate } from "react-router";
import { Button, Heading, Image, Text } from "@chakra-ui/react";
import { FiArrowLeft } from "react-icons/fi";
import notFound from "../../assets/notFound.svg";
import css from "../../styles/global.module.css";


const NotFoundPage = () => {
  const nav = useNavigate()

  return (
    <main className={css.notFound}>
      <div>
        <Image src={notFound} width="250px" height="250px" />
        <Heading as="h2" size="3xl">
          404 - ¡Lo sentimos!
          <span style={{ color: "var(--brand-green-100)" }}> Página</span> <span style={{ color: "var(--brand-blue-100)" }}>no encontrada.</span>
        </Heading>
        <Text fontSize="2xl" fontWeight="normal" mb={3}>
          La página que estas buscando puede haber sido removida, su nombre ha cambiado o esta temporalmente deshabilitada.
        </Text>
        <Button
          size="xl"
          fontSize="lg"
          borderRadius="4xl"
          backgroundColor="brand.blue.100"
          onClick={() => nav(-1)}
          _hover={{ backgroundColor: "brand.blue.600" }}
        >
          <FiArrowLeft /> Volver a la página anterior
        </Button>
      </div>
    </main>
  );
};

export default NotFoundPage;