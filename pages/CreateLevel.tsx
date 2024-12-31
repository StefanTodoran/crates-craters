import { useContext, useState } from "react";
import InputCard from "../components/InputCard";
import GlobalContext from "../GlobalContext";
import { createBlankBoard } from "../util/board";
import { doPageChange } from "../util/events";
import { generateUUID } from "../util/loader";
import { UserLevel } from "../util/types";

interface Props {
  createLevelCallback: (newLevel: UserLevel) => void,
  existingLevelNames: string[],
}

export default function CreateLevel({ createLevelCallback, existingLevelNames }: Props) {
  const { userData, userCredential } = useContext(GlobalContext);

  const [levelTitle, setLevelTitle] = useState("");
  const levelCreated = new Date();

  let inputHint = "Click create to get started!";
  if (!userCredential) inputHint = "Log in to start creating levels!";
  else if (!levelTitle) inputHint = "Level title is required!";
  else if (existingLevelNames.includes(levelTitle.toLowerCase())) inputHint = "Level title must be unique!";

  return (
    <InputCard
      title={"Create New Level"}
      hints={[inputHint]}
      fields={[
        {
          label: "Level Title",
          value: levelTitle,
          onChange: setLevelTitle,
          disabled: !userCredential
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
          created: levelCreated.toISOString(),
          user_name: userData!.user_name,
        });
        setLevelTitle("");
        doPageChange(1);
      }}
      buttonDisabled={!levelTitle || !userCredential}
    />
  );
}