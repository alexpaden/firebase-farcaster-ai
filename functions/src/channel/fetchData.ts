import { init, fetchQuery } from "@airstack/node";
import * as functions from "firebase-functions";
import { processThread } from "../thread/processThread";

init(functions.config().airstack.api_key);

const fetchChannelData = async (channelId: string): Promise<{ id: string; url: string }> => {
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
    const { id, url } = data.channel;
    return { id, url };
};

const fetchTrendingCasts = async (rootParentUrl: string, timeFrame: string): Promise<any[]> => {
    const timeFrameMapping: { [key: string]: string } = {
            day: 'one_day',
            week: 'seven_days'
    };
    const mappedTimeFrame = timeFrameMapping[timeFrame] || 'one_day';
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
    return response.data.TrendingCasts.TrendingCast.map((cast: any) => cast.hash);
};

const fetchChannelDataAndProcessThreads = async (channelId: string, threadCount: number, shouldRefresh: boolean, timeFrame: string): Promise<any> => {
    const { id, url } = await fetchChannelData(channelId);
    const trendingCastsHashes = await fetchTrendingCasts(url, timeFrame);
    const topHashes = trendingCastsHashes.slice(0, threadCount);

    const threadSummaries = await Promise.all(
        topHashes.map(hash => processThread(hash, 5, shouldRefresh))
    );

    const capture_date = new Date().toISOString().split('T')[0];

    return {
        channel_id: id,
        number_of_threads_used: threadCount,
        time_frame: timeFrame,
        capture_date: capture_date,
        top_thread_summaries: threadSummaries.map(ts => ({
            hash: ts.hash,
            timestamp: ts.formattedResult.timestamp,
            author_username: ts.formattedResult.author_username,
            initial_cast: ts.formattedResult.initial_cast,
            highlighted_replies: ts.formattedResult.highlighted_replies,
            thread_summary: ts.formattedResult.thread_summary,
            highlighted_repliers: ts.formattedResult.highlighted_repliers,
            total_replies_count: ts.formattedResult.total_replies_count,
            filtered_replies_count: ts.formattedResult.filtered_replies_count
        }))
    };
};

export { fetchChannelDataAndProcessThreads };
