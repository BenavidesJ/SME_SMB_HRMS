import { Grid, GridItem, VStack, IconButton, Text, InputGroup, Input, Center } from '@chakra-ui/react';
import { Layout } from '../../../layouts';
import { useNavigate } from 'react-router';
import { modules } from './modulesList';
import { FiSearch } from 'react-icons/fi';
import { useCallback, useRef, useState } from 'react';


const Mantenimientos = () => {
  const nav = useNavigate();
  const debounceRef = useRef<number | null>(null);
  const [showModules, setShowModules] = useState(modules);

  const handleNavigation = (path: string): void => {
    nav(path, { replace: true });
  }

  const filterModules = (query: string) => {
    if (!query) {
      setShowModules(modules);
      return;
    }
    const q = query.toLowerCase();
    setShowModules(
      modules.filter((item) =>
        item.name.toLowerCase().includes(q)
      )
    );
  };
  const searchModule = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = window.setTimeout(() => {
        filterModules(value);
      }, 300);
    },
    []
  );

  return (
    <Layout pageTitle="Página de Mantenimientos">
      <Center mt="1.15rem">
        <InputGroup startElement={<FiSearch />}>
          <Input
            name="find"
            placeholder="Buscar módulos"
            w="300px"
            onChange={searchModule}
            size="md"
            _focus={{ outlineColor: "blue.600" }}
          />
        </InputGroup>
      </Center>
      <Grid
        templateColumns="repeat(6, 1fr)"
        gap="4"
        p="0.50rem 2rem"
      >
        {
          showModules && showModules.map((m) => (
            <GridItem key={m.name}>
              <VStack>
                <IconButton
                  variant="solid"
                  onClick={() => handleNavigation(m.path)}
                  backgroundColor="brand.green.75"
                  color="brand.blue.100"
                  size="xl"
                >
                  {m.icon}
                </IconButton>
                <Text textStyle="md" textAlign="center" >{m.name}</Text>
              </VStack>
            </GridItem>
          ))
        }
        <GridItem />
      </Grid>
    </Layout>
  )
}

export default Mantenimientos