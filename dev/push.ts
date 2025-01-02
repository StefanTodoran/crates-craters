import fse from "fs-extra";
import { admin } from "./firebase";
import { log } from "./logging";

async function main() {
    const allFiles = fse.readdirSync("./levels").filter(file => file !== "metadata.txt");
    const rawLevels = allFiles.map(file => fse.readFileSync(`./levels/${file}`, "utf8"));
    const parsedLevels = rawLevels.map(level => JSON.parse(level));

    // Delete all existing levels
    const existingLevels = await admin.firestore().collection("officialLevels").get();
    const batch = admin.firestore().batch();
    existingLevels.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Add all the new levels
    const newBatch = admin.firestore().batch();
    parsedLevels.forEach(level => {
        const ref = admin.firestore().collection("officialLevels").doc(level.id);
        newBatch.set(ref, level);
    });
    await newBatch.commit();

    const levels = await admin.firestore().collection("officialLevels").get();
    if (levels.size !== parsedLevels.length) {
        // TODO: A more robust check of the data itself?
        log(`Error: Expected to push ${parsedLevels.length} levels but only ${levels.size} were written.`);
        // @ts-ignore
        process.exit(1);
    }

    log(`Successfully pushed ${parsedLevels.length} levels to server.`);
    // @ts-ignore
    process.exit(0);
}

log("\nPushing official levels to server...");
main();