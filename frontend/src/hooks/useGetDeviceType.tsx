import { useBreakpointValue } from "@chakra-ui/react"

export const useGetDeviceType = () => {
  const deviceType = useBreakpointValue({
    base: "mobile",
    md: "tablet",
    lg: "desktop"
  })

  return {
    deviceType: deviceType ?? "desktop",
  }
}
