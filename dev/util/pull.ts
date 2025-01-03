import fse from "fs-extra";
import { getAllEntries } from "./firebase";
import { log, LogStatus } from "./logging";

async function getOrderedRawLevels() {
    const rawLevels = await getAllEntries("officialLevels");
    rawLevels.sort((levelA, levelB) => levelA.order - levelB.order);
    return rawLevels;
} 

async function main() {
    const rawLevels = await getOrderedRawLevels();
    log(`Successfully received ${rawLevels.length} levels from server.`, LogStatus.GOOD);
    
    const levelsPath = process.env.LEVELS_PATH!;
    console.log("process.env.LEVELS_PATH", process.env.LEVELS_PATH);
    fse.removeSync(levelsPath);
    fse.mkdirSync(levelsPath);

    // Write each level to a file in the levels folder, as a json.
    let successCount = 0;
    rawLevels.forEach(level => {
        const levelFile = `${levelsPath}/${level.id}.json`;
        fse.writeFileSync(levelFile, JSON.stringify(level, Object.keys(level).sort(), 4));

        if (!fse.existsSync(levelFile)) {
            log(`Write to ${levelFile} failed! Levels have not been saved.\n`, LogStatus.ERROR);
        } else {
            successCount++;
        }
    });
    
    if (successCount === rawLevels.length) {
        log(`Successfully wrote all ${successCount} raw levels to levels folder!\n`, LogStatus.GOOD);

        // Write a timestamp file to record when this pull occurred
        const timestamp = new Date().toISOString();
        fse.writeFileSync(`${levelsPath}/metadata.txt`, timestamp);

        // @ts-ignore This method exists... not sure why TypeScript is bugging out.
        process.exit(0);
    } else {
        log(`Failed to write ${rawLevels.length - successCount} levels to levels folder!\n`, LogStatus.ERROR);
        // @ts-ignore
        process.exit(1);
    }
}

log("\nPulling official levels from server...");
main();