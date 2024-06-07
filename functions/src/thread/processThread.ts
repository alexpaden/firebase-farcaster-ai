import admin from "../firebaseAdmin";
import { fetchData } from "./fetchData";
import { formatWithOpenAI } from "./openai";

const db = admin.firestore();

interface ThreadResult {
    hash: string;
    formattedResult?: any;
    error?: string;
}

export async function processThread(hash: string, numReplies: number, shouldRefresh: boolean): Promise<ThreadResult> {
    const docRef = db.collection("threads").doc(hash);
    try {
        let result;

        if (shouldRefresh) {
            result = await fetchData(hash);
            const formattedResult = await formatWithOpenAI(result, numReplies);
            await docRef.set(formattedResult);
            return { hash, formattedResult };
        }

        const doc = await docRef.get();
        if (doc.exists) {
            result = doc.data();
        } else {
            result = await fetchData(hash);
            const formattedResult = await formatWithOpenAI(result, numReplies);
            await docRef.set(formattedResult);
            return { hash, formattedResult };
        }

        return { hash, formattedResult: result };
    } catch (error) {
        console.error("Error processing thread:", error);
        return { hash, error: "Internal Server Error" };
    }
}
