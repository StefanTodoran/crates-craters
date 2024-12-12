import { useState } from "react";
import InputCard from "../components/InputCard";
import { createBlankBoard } from "../util/board";
import { doPageChange } from "../util/events";
import { generateUUID } from "../util/loader";
import { UserLevel } from "../util/types";

interface Props {
  createLevelCallback: (newLevel: UserLevel) => void,
  existingLevelNames: string[],
}

export default function CreateLevel({ createLevelCallback, existingLevelNames }: Props) {
  const [levelTitle, setLevelTitle] = useState("");
  const [levelDesigner, setLevelDesigner] = useState("");
  const levelCreated = new Date();

  let inputHint = "Click create to get started!";
  if (!levelTitle && !levelDesigner) inputHint = "Both title and designer name are required!";
  else if (!levelTitle) inputHint = "Level title is required!";
  else if (existingLevelNames.includes(levelTitle.toLowerCase())) inputHint = "Level title must be unique!";
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
        setLevelTitle("");
        setLevelDesigner("");
        doPageChange(0);
      }}
      buttonDisabled={!levelTitle || !levelDesigner}
    />
  );
}