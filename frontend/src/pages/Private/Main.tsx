import { Layout } from "../../components/layout"
import { useAuth } from "../../context/AuthContext";



const Main = () => {
  const { user } = useAuth();
  return (
    <Layout pageTitle={`Bienvenido de vuelta ${user?.nombre}`}>
      <h1>Sistema de Gestión de Recursos Humanos de BioAlquimia</h1>
    </Layout>
  )
}

export default Main