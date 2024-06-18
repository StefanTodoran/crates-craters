import { useState } from "react";
import { View } from "react-native";

import { normalize } from "../TextStyles";
import { doPageChange } from "../util/events";
import { generateUUID } from "../util/loader";
import { UserLevel, createBlankBoard } from "../util/types";

import InputCard from "../components/InputCard";
import SubpageContainer from "../components/SubpageContainer";

interface Props {
  createLevelCallback: (newLevel: UserLevel) => void,
}

export default function CreateLevel({ createLevelCallback }: Props) {
  const [levelTitle, setLevelTitle] = useState("");
  const [levelDesigner, setLevelDesigner] = useState("");
  const levelCreated = new Date();
  // const nameTaken = levels.some(lvl => lvl.name === levelTitle);

  let inputHint = "Click create to get started!";
  if (!levelTitle && !levelDesigner) inputHint = "Both title and designer name are required!";
  else if (!levelTitle) inputHint = "Level title is required!";
  else if (!levelDesigner) inputHint = "Designer name required!";

  return (
    <SubpageContainer center>
      <InputCard
        title={"Create New Level"}
        hints={[inputHint]}
        fields={[
          {
            label: "Level Title",
            value: levelTitle,
            update: setLevelTitle
          },
          {
            label: "Designer Name",
            value: levelDesigner,
            update: setLevelDesigner
          },
        ]}
        buttonText="Create"
        buttonCallback={() => {
          createLevelCallback({
            name: levelTitle,
            uuid: generateUUID(),
            board: createBlankBoard(),
            completed: false,
            official: false,
            designer: levelDesigner,
            created: levelCreated.toISOString(),
          });
          doPageChange(0);
        }}
        buttonDisabled={!levelTitle || !levelDesigner}
      />
      <View style={{ height: normalize(60) }} />
    </SubpageContainer>
  );
}