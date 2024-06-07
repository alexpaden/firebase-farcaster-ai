import {fetchChannelDataAndProcessThreads} from "./fetchData";
import {formatChannelSummaryWithOpenAI} from "./openai";
import admin from "../firebaseAdmin";

interface ChannelResult {
  channel_id: string;
  number_of_threads_used: number;
  top_thread_summaries: any[];
  channel_summary?: string;
  error?: string;
  time_frame: string;
  capture_date: string;
}

/**
 * Processes a channel by fetching data and generating summaries, handling caching mechanism.
 *
 * @param {string} channelId - The ID of the channel to process.
 * @param {number} threadCount - The number of threads to retrieve and process.
 * @param {boolean} shouldRefresh - Flag to determine if data should be refreshed from the source.
 * @param {string} [timeFrame="day"] - The time frame for which data is processed, use 'day' or 'week'.
 * @return {Promise<ChannelResult>} The result of the channel processing, including data and possible errors.
 */
export async function processChannel(
  channelId: string,
  threadCount: number,
  shouldRefresh: boolean,
  timeFrame = "day"
): Promise<ChannelResult> {
  const db = admin.firestore();
  const hashKey = `${channelId}-${timeFrame}-${new Date().toISOString().split("T")[0]}`;
  const docRef = db.collection("channels").doc(hashKey);

  if (!shouldRefresh) {
    const doc = await docRef.get();
    if (doc.exists) {
      return doc.data() as ChannelResult;
    }
  }

  try {
    const channelData = await fetchChannelDataAndProcessThreads(channelId, threadCount, shouldRefresh, timeFrame);
    const topThreadSummaries = channelData.top_thread_summaries;
    const formattedChannelSummary = await formatChannelSummaryWithOpenAI(topThreadSummaries, channelId, threadCount);

    const result: ChannelResult = {
      ...channelData,
      channel_summary: formattedChannelSummary.channel_summary,
      time_frame: timeFrame,
      capture_date: channelData.capture_date,
    };

    await docRef.set(result);
    return result;
  } catch (error) {
    console.error("Error processing channel:", error);
    const errorResult: ChannelResult = {
      channel_id: channelId,
      number_of_threads_used: threadCount,
      top_thread_summaries: [],
      error: "Internal Server Error",
      time_frame: timeFrame,
      capture_date: new Date().toISOString().split("T")[0],
    };

    await docRef.set(errorResult);
    return errorResult;
  }
}
