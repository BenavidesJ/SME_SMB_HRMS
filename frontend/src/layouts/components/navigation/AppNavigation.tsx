import { useGetDeviceType } from "../../../hooks";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";


export const AppNavigation = () => {
  const { deviceType } = useGetDeviceType();

  if (deviceType !== "desktop") return <MobileNav />
  return <DesktopNav />
}
