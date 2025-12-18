import { Image } from "@chakra-ui/react";

interface LogoProps {
  /*
   El path de donde se obtiene la imagen.
  */
  readonly src: string;
  /*
   El ancho de la imagen.
  */
  readonly width: string;
  /*
   El alto de la imagen.
  */
  readonly heigth: string;
}

export const Logo = ({ src, width, heigth }: LogoProps) => {
  return (
    <Image src={src} width={width} height={heigth} />
  )
}
