import { UserCredential } from "firebase/auth";
import { useContext, useMemo } from "react";
import { Text } from "react-native";
import CartIcon from "../assets/main_theme/cart.png";
import ProfileIcon from "../assets/main_theme/profile.png";
import SubpageContainer from "../components/SubpageContainer";
import Subpages, { SubpageTab } from "../components/Subpages";
import GlobalContext from "../GlobalContext";
import TextStyles from "../TextStyles";
import { colors } from "../Theme";
import ProfilePage from "./ProfilePage";

interface Props {
  attemptSignIn: () => Promise<void>,
  setUserCredential: (newCredential: UserCredential | undefined) => void,
}

export default function StorePage({ attemptSignIn, setUserCredential }: Props) {
  const { darkMode } = useContext(GlobalContext);

  const pageComponents = useMemo(() => {
    return [
      <ProfilePage attemptSignIn={attemptSignIn} setUserCredential={setUserCredential} />,
      <SubpageContainer center>
        <Text style={[TextStyles.subtitle(darkMode), { color: colors.YELLOW_THEME.MAIN_COLOR }]}>
          Coming Soon
        </Text>

        <Text style={TextStyles.paragraph(darkMode)}>
          A way to spend your accumulated coins is in the works and coming soon!
        </Text>
      </SubpageContainer>,
    ];
  }, []);

  const pageTabs = useMemo((): SubpageTab[] => {
    return [
      {
        label: "Profile",
        color: colors.YELLOW_THEME.MAIN_COLOR,
        icon: ProfileIcon,
        sfSymbol: "person.crop.circle.fill",
      },
      {
        label: "Store",
        color: colors.YELLOW_THEME.MAIN_COLOR,
        icon: CartIcon,
        sfSymbol: "cart.fill",
      },
    ];
  }, []);

  return (
    <Subpages pageComponents={pageComponents} pageTabs={pageTabs} />
  );
}