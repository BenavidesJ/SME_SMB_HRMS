import { useParams } from "react-router";
import { Layout } from "../../../layouts";

export default function ColaboradorDetalle() {
  const { id } = useParams<{ id: string }>();

  return (
    <Layout pageTitle="Detalle del colaborador">
      <div>Colaborador ID: {id}</div>


    </Layout>
  );
}
