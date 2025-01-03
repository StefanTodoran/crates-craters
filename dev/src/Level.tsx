import { OfficialLevelDocument } from "../util/firebase";

interface Props {
  levelData: OfficialLevelDocument,
  setLevelData: (levelData: OfficialLevelDocument) => void,
}

export default function Level({ levelData, setLevelData }: Props) {
  return (
    <div className="level-card">
      <h2>Level {levelData.order}</h2>
      <div>
        <label>Name: </label>
        <input
          type="text"
          value={levelData.name}
          onChange={(e) => {
            const updatedLevel = {
              ...levelData,
              name: e.target.value
            };
            setLevelData(updatedLevel);
          }}
        />
      </div>
      <div>
        <label>Order: </label>
        <input
          type="number"
          value={levelData.order}
          onChange={(e) => {
            const updatedLevel = {
              ...levelData,
              order: parseInt(e.target.value)
            };
            setLevelData(updatedLevel);
          }}
        />
      </div>
      <div>
        <label>Board: </label>
        <input
          type="text"
          value={levelData.board}
          onChange={(e) => {
            const updatedLevel = {
              ...levelData,
              board: e.target.value
            };
            setLevelData(updatedLevel);
          }}
        />
      </div>
      <button onClick={() => {
        const json = JSON.stringify(levelData, null, 4);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${levelData.uuid}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }}>Save</button>
    </div>
  );
}
