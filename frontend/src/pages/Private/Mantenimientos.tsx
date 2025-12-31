import { Grid, GridItem, Card, Heading } from '@chakra-ui/react';
import { Layout } from '../../layouts';
import { useNavigate } from 'react-router';
import { Button } from '../../components/general/button/Button';

const Mantenimientos = () => {
  const nav = useNavigate();

  const handleNavigation = (path: string): void => {
    nav(path, { replace: true });
  }

  return (
    <Layout pageTitle="Página de Mantenimientos">
      <Grid
        templateColumns="repeat(3, 1fr)"
        gap="6"
      >
        <GridItem>
          <Card.Root>
            <Card.Header>
              <Heading size="lg">Colaboradores</Heading>
            </Card.Header>
            <Card.Body />
            <Card.Footer justifyContent="flex-start">
              <Button variant="outline" onClick={() => handleNavigation("colaboradores")}>Ir</Button>
            </Card.Footer>
          </Card.Root>
        </GridItem>
        <GridItem />
      </Grid>
    </Layout>
  )
}

export default Mantenimientos