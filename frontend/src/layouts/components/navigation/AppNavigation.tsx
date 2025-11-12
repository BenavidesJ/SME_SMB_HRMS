import { useGetDeviceType } from "../../../hooks";


export const AppNavigation = () => {
  const userDevice = useGetDeviceType();
  console.log(userDevice);
  return (
    <div>DesktopNavigation</div>
  )
}
