import { fetchChannelDataAndProcessThreads } from "./fetchData";
import { formatChannelSummaryWithOpenAI } from "./openai";
import admin from '../firebaseAdmin';

interface ChannelResult {
  channel_id: string;
  number_of_threads_used: number;
  top_thread_summaries: any[];
  channel_summary?: string;
  error?: string;
  time_frame: string;
  capture_date: string;
}

export async function processChannel(
  channelId: string,
  threadCount: number,
  shouldRefresh: boolean,
  timeFrame: string = 'day'
): Promise<ChannelResult> {
  const db = admin.firestore();
  const timeFrameMapping: { [key: string]: string } = {
    day: 'one_day',
    week: 'seven_days'
  };
  const graphQLTimeFrame = timeFrameMapping[timeFrame as keyof typeof timeFrameMapping];
  const hashKey = `${channelId}-${timeFrame}-${new Date().toISOString().split('T')[0]}`;
  const docRef = db.collection('channels').doc(hashKey);

  if (!shouldRefresh) {
    const doc = await docRef.get();
    if (doc.exists) {
      return doc.data() as ChannelResult;
    }
  }

  try {
    const channelData = await fetchChannelDataAndProcessThreads(channelId, threadCount, shouldRefresh, graphQLTimeFrame);
    const topThreadSummaries = channelData.top_thread_summaries;
    const formattedChannelSummary = await formatChannelSummaryWithOpenAI(topThreadSummaries, channelId, threadCount);

    const result: ChannelResult = {
      ...channelData,
      channel_summary: formattedChannelSummary.channel_summary,
      time_frame: timeFrame,
      capture_date: channelData.capture_date
    };

    await docRef.set(result);
    return result;
  } catch (error) {
    console.error("Error processing channel:", (error as Error).message);
    const errorResult: ChannelResult = {
      channel_id: channelId,
      number_of_threads_used: threadCount,
      top_thread_summaries: [],
      error: "Internal Server Error",
      time_frame: timeFrame,
      capture_date: new Date().toISOString().split('T')[0]
    };

    await docRef.set(errorResult);
    return errorResult;
  }
}
