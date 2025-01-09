import SubpageContainer from "../components/SubpageContainer";
import TutorialHint, { Tutorial } from "../components/TutorialHint";

export default function HowToPlay() {
  const tutorialVals: Tutorial[] = Object.values(Tutorial).filter(t => !isNaN(Number(t))) as Tutorial[];

  return (
    <SubpageContainer lessTopPad>
      {tutorialVals.map(t => <TutorialHint key={t} introduces={[t]} hideTutorial={() => {}} onlyContent />)}
    </SubpageContainer>
  );
}