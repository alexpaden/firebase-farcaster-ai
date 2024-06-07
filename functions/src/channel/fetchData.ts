import {init, fetchQuery} from "@airstack/node";
import * as functions from "firebase-functions";
import {processThread} from "../thread/processThread";

init(functions.config().airstack.api_key);

interface ChannelData {
  id: string;
  url: string;
}

interface Cast {
  hash: string;
}

interface ThreadSummary {
  hash: string;
  cast_timestamp: string;
  summary_timestamp: string;
  author_username: string;
  initial_cast: string;
  highlighted_replies: string;
  thread_summary: string;
  highlighted_repliers: string[];
  total_replies_count: number;
  filtered_replies_count: number;
  socialCapitalValue: number | null;
}

const fetchChannelData = async (channelId: string): Promise<ChannelData> => {
  const response = await fetch(`https://api.neynar.com/v2/farcaster/channel?id=${channelId}&viewer_fid=533`, {
    headers: {
      "Accept": "application/json",
      "api_key": functions.config().neynar.api_key as string,
    },
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data = await response.json();
  return {id: data.channel.id, url: data.channel.url};
};

const fetchTrendingCasts = async (rootParentUrl: string, timeFrame: string): Promise<string[]> => {
  const timeFrameMapping: { [key: string]: string } = {
    day: "one_day",
    week: "seven_days",
  };

  if (!["day", "week"].includes(timeFrame)) {
    throw new Error(`Invalid time frame provided: ${timeFrame}. Valid options are 'day' or 'week'.`);
  }

  const mappedTimeFrame = timeFrameMapping[timeFrame];
  const query = `
    query GetTrendingCasts {
        TrendingCasts(
          input: {timeFrame: ${mappedTimeFrame}, blockchain: ALL, criteria: social_capital_value, limit: 25, filter: {rootParentUrl: {_eq: "${rootParentUrl}"}}}
        ) {
            TrendingCast {
                hash
            }
        }
    }`;

  const response = await fetchQuery(query);

  if (!response || !response.data) {
    throw new Error("GraphQL query failed to return valid data.");
  }

  return response.data.TrendingCasts.TrendingCast.map((cast: Cast) => cast.hash);
};

const fetchChannelDataAndProcessThreads = async (channelId: string, threadCount: number, shouldRefresh: boolean, timeFrame: string): Promise<any> => {
  const {id, url} = await fetchChannelData(channelId);
  const trendingCastsHashes = await fetchTrendingCasts(url, timeFrame);
  const topHashes = trendingCastsHashes.slice(0, threadCount);

  const threadSummaries = await Promise.all(
    topHashes.map((hash) => processThread(hash, 5, shouldRefresh))
  );

  const captureDate = new Date().toISOString().split("T")[0];

  return {
    channel_id: id,
    number_of_threads_used: threadCount,
    time_frame: timeFrame,
    summary_timestamp: captureDate,
    top_thread_summaries: threadSummaries as ThreadSummary[],
  };
};

export {fetchChannelDataAndProcessThreads};
