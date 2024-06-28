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
  prompt_used?: string;
  error?: string;
}

/**
 * Processes a specific thread by fetching and possibly refreshing its data,
 * then formatting it for presentation using OpenAI.
 *
 * @param {string} hash - The unique identifier for the thread.
 * @param {number} numReplies - The number of replies to process for the thread.
 * @param {boolean} shouldRefresh - Whether to fetch fresh data regardless of existing cache.
 * @param {string} prompt - The prompt to use for OpenAI formatting.
 * @return {Promise<ThreadResult>} The result of processing the thread, including formatted data or an error.
 */
export async function processThread(hash: string, numReplies: number, shouldRefresh: boolean, prompt: string): Promise<ThreadResult> {
  const docRef = db.collection("threads").doc(`${hash}-${prompt}`);
  try {
    let result;

    if (shouldRefresh) {
      result = await fetchData(hash);
      const formattedResult = await formatWithOpenAI(result, numReplies, prompt);
      await docRef.set(formattedResult);
      return {hash, prompt_used: prompt, ...formattedResult};
    }

    const doc = await docRef.get();
    if (doc.exists) {
      result = doc.data();
    } else {
      result = await fetchData(hash);
      const formattedResult = await formatWithOpenAI(result, numReplies, prompt);
      await docRef.set(formattedResult);
      return {hash, prompt_used: prompt, ...formattedResult};
    }

    return {hash, prompt_used: prompt, ...result};
  } catch (error) {
    console.error("Error processing thread:", error);
    return {hash, prompt_used: prompt, error: "Internal Server Error"};
  }
}
