import { useEffect, useState } from "react";
import "./App.css";
import PurpleBanner from "./assets/purple_banner.png";
import Level from "./Level";

enum Page {
  MENU,
  LIST_LEVELS,
  BOARD_EDITOR,
}

function App() {
  const [page, setPage] = useState(Page.MENU);
  const [levels, setLevels] = useState<any[]>([]);

  useEffect(() => {
    // This uses Vite's glob import feature
    const loadLevels = async () => {
      const levelModules = import.meta.glob("../levels/*.json");
      const loadedLevels = [];

      for (const path in levelModules) {
        const levelModule: any = await levelModules[path]();
        loadedLevels.push({
          ...levelModule.default,
          filename: path.replace("../levels/", "").replace(".json", "")
        });
      }

      setLevels(loadedLevels);
    };

    loadLevels();
  }, []);

  const saveLevels = async () => {
    // Create a folder containing all level JSONs
    levels.forEach(level => {
      const { filename, ...levelData } = level;
      const json = JSON.stringify(levelData, null, 4);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const addNewLevel = () => {
    setLevels([...levels, {
      filename: generateUUID(),
      order: levels.length + 1,
      name: "New Level",
      uuid: generateUUID()
    }]);
  };

  useEffect(() => {
    const sortedLevels = [...levels].sort((a, b) => a.order - b.order);
    if (JSON.stringify(sortedLevels) !== JSON.stringify(levels)) {
      setLevels(sortedLevels);
    }
  }, [levels]);

  return (
    <>
      <img src={PurpleBanner} className="header-banner" />

      <div className="page-container">
        {page === Page.MENU && <>
          <h1>Menu</h1>
          <div className="menu-container">
            <button onClick={() => setPage(Page.LIST_LEVELS)}>Levels List</button>
            <button onClick={() => setPage(Page.BOARD_EDITOR)}>Board Editor</button>
          </div>
        </>}

        {page === Page.LIST_LEVELS && <>
          <h1>Levels</h1>
          <div className="buttons-container">
            <button onClick={addNewLevel}>Add New</button>
            <button onClick={saveLevels}>Save Changes</button>
            <button onClick={() => setPage(Page.MENU)}>Menu</button>
          </div>

          <div className="level-cards-list">
            {levels.map((level) => (
              <Level key={level.filename} levelData={level} setLevelData={(updatedLevel) => {
                setLevels(levels.map(lvl =>
                  lvl.uuid === level.uuid ? updatedLevel : lvl
                ));
              }} />
            ))}
          </div>
        </>}
      </div>
    </>
  )
}

export default App;

function generateUUID() {
  return new Date().getTime().toString() + Math.random().toString(16).slice(2);
}