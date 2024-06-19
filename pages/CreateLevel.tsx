import { useState } from "react";
import { doPageChange } from "../util/events";
import { generateUUID } from "../util/loader";
import { UserLevel } from "../util/types";
import { createBlankBoard } from "../util/board";
import InputCard from "../components/InputCard";

interface Props {
  createLevelCallback: (newLevel: UserLevel) => void,
}

export default function CreateLevel({ createLevelCallback }: Props) {
  const [levelTitle, setLevelTitle] = useState("");
  const [levelDesigner, setLevelDesigner] = useState("");
  const levelCreated = new Date();

  let inputHint = "Click create to get started!";
  if (!levelTitle && !levelDesigner) inputHint = "Both title and designer name are required!";
  else if (!levelTitle) inputHint = "Level title is required!";
  else if (!levelDesigner) inputHint = "Designer name required!";

  return (
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
  );
}