import { colors } from "../Theme";
import SimpleButton from "../components/SimpleButton";

interface Props {
  children: React.ReactNode,
}

export default function EditorPage({ 
  children,
}: Props) {
  return (
    <>
      {children}
      {/* TODO: add navigation area to bottom like AccountSettings.tsx page, but for creation */}
      {/* <SimpleButton text={"Create New"} theme={colors.RED_THEME}/> */}
    </>
  );
}