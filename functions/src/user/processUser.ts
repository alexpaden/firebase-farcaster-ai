import { fetchUserCasts } from "./fetchData";
import { processThread, ThreadResult } from "../thread/processThread";
import { formatUserSummaryWithOpenAI } from "./openai";

export interface UserSummary {
  summary_timestamp: string;
  preferred_channels: { channelId: string | null; count: number }[];
  preferred_threads: ThreadResult[];
  user_summary?: string;
}

interface ChannelCounts {
  [key: string]: number;
}

/**
 * Processes user-specific data by fetching their casts, summarizing threads,
 * and organizing information by channels and thread interactions.
 * Additionally, it generates an AI-based summary of the user's most popular content.
 *
 * @param {string} username - The username identifier for the user.
 * @param {number} threadCount - The number of top threads to process.
 * @param {boolean} shouldRefresh - Whether to fetch fresh data regardless of existing cache.
 * @return {Promise<UserSummary>} - The summary of user data including thread and channel preferences and an AI-generated summary.
 */
export async function processUser(username: string, threadCount: number, shouldRefresh: boolean): Promise<UserSummary> {
  const casts = await fetchUserCasts(username);

  const validCasts = casts.filter(cast => cast.socialCapitalValue && cast.socialCapitalValue.formattedValue != null);
  const sortedCasts = validCasts.sort((a, b) => b.socialCapitalValue.formattedValue - a.socialCapitalValue.formattedValue);
  const topThreads = sortedCasts.slice(0, threadCount);

  const channelCounts = topThreads.reduce((acc: ChannelCounts, cast) => {
    const channelId = cast.channel?.channelId || 'no_channel';
    acc[channelId] = (acc[channelId] || 0) + 1;
    return acc;
  }, {} as ChannelCounts);

  const preferredChannels = Object.entries(channelCounts).map(([channelId, count]) => ({
    channelId: channelId === 'no_channel' ? null : channelId,
    count
  }));

  const preferredThreads = await Promise.all(
    topThreads.map(cast => processThread(cast.hash, 5, shouldRefresh))
  );

  const userSummaryText = await formatUserSummaryWithOpenAI({
    summary_timestamp: new Date().toISOString(),
    preferred_channels: preferredChannels,
    preferred_threads: preferredThreads
  }, username);

  return {
    summary_timestamp: new Date().toISOString(),
    preferred_channels: preferredChannels,
    preferred_threads: preferredThreads,
    user_summary: userSummaryText
  };
}
