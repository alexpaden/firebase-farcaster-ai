import admin from "../firebaseAdmin";
import {fetchData} from "./fetchData";
import {formatWithOpenAI} from "./openai";

const db = admin.firestore();

export interface ThreadResult {
  hash: string;
  cast_timestamp?: string;
  thread_summary?: string;
  filtered_replies_count?: number;
  initial_cast?: string;
  highlighted_repliers?: string[];
  highlighted_replies?: string;
  summary_timestamp?: string;
  author_username?: string;
  total_replies_count?: number;
  socialCapitalValue?: number | null;
  error?: string;
}

/**
 * Processes a specific thread by fetching and possibly refreshing its data,
 * then formatting it for presentation using OpenAI.
 *
 * @param {string} hash - The unique identifier for the thread.
 * @param {number} numReplies - The number of replies to process for the thread.
 * @param {boolean} shouldRefresh - Whether to fetch fresh data regardless of existing cache.
 * @return {Promise<ThreadResult>} The result of processing the thread, including formatted data or an error.
 */
export async function processThread(hash: string, numReplies: number, shouldRefresh: boolean): Promise<ThreadResult> {
  const docRef = db.collection("threads").doc(hash);
  try {
    let result;

    if (shouldRefresh) {
      result = await fetchData(hash);
      const formattedResult = await formatWithOpenAI(result, numReplies);
      await docRef.set(formattedResult);
      return {hash, ...formattedResult};
    }

    const doc = await docRef.get();
    if (doc.exists) {
      result = doc.data();
    } else {
      result = await fetchData(hash);
      const formattedResult = await formatWithOpenAI(result, numReplies);
      await docRef.set(formattedResult);
      return {hash, ...formattedResult};
    }

    return {hash, ...result};
  } catch (error) {
    console.error("Error processing thread:", error);
    return {hash, error: "Internal Server Error"};
  }
}
