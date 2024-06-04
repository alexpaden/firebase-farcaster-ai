import {init, fetchQuery} from "@airstack/node";
import * as functions from "firebase-functions";


const GET_REPLY_INFO_QUERY = `
query GetCastReplyDetails($hash: String!) {
  FarcasterReplies(
    input: {filter: {hash: {_eq: $hash}}, blockchain: ALL, limit: 50}
  ) {
    Reply {
      hash
      socialCapitalValue {
        formattedValue
      }
    }
  }
}
`;

const FOUR_MONTHS_MS = 4 * 30 * 24 * 60 * 60 * 1000;

init(functions.config().airstack.api_key);

interface Cast {
  username: string;
  hash: string;
  parent_hash: string;
  thread_hash: string;
  text: string;
  likes_count: number;
  recasts_count: number;
  power_badge: string | null;
  replies_count: number;
  timestamp: string;
  socialCapitalValue: number | null;
  direct_replies?: Cast[];
}

interface SocialCapitalValueResponse {
  hash: string;
  socialCapitalValue: {
    formattedValue: number;
  } | null;
}

const fetchData = async (hash: string): Promise<{ initial_cast: Cast; direct_replies: Cast[]; total_replies_count: number; filtered_replies_count: number }> => {
  const response = await fetch(`https://api.neynar.com/v2/farcaster/cast/conversation?identifier=${hash}&type=hash&reply_depth=5&include_chronological_parent_casts=false&viewer_fid=533`, {
    headers: {
      "Accept": "application/json",
      "api_key": functions.config().neynar.api_key as string,
    },
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data = await response.json();
  const conversation = data.conversation;

  if (!conversation) {
    throw new Error("Invalid conversation data");
  }

  const isOlderThanFourMonths = (timestamp: string): boolean => {
    const castDate = new Date(timestamp).getTime();
    const now = Date.now();
    return now - castDate > FOUR_MONTHS_MS;
  };

  let totalRepliesCount = 0;

  const extractInfo = (cast: any): Cast => ({
    username: cast.author.username,
    hash: cast.hash,
    parent_hash: cast.parent_hash,
    thread_hash: cast.thread_hash,
    text: cast.text,
    likes_count: cast.reactions.likes_count,
    recasts_count: cast.reactions.recasts_count,
    power_badge: cast.author.power_badge,
    replies_count: cast.replies.count,
    timestamp: cast.timestamp,
    socialCapitalValue: null,
  });

  const extractReplies = (replies: any[]): Cast[] => {
    totalRepliesCount += replies.length;
    return replies
      .map((reply) => {
        const extractedReply: Cast = {
          ...extractInfo(reply),
          direct_replies: reply.direct_replies ? extractReplies(reply.direct_replies) : [],
        };
        extractedReply.replies_count = (extractedReply.direct_replies?.length ?? 0) + (extractedReply.direct_replies?.reduce((acc, r) => acc + r.replies_count, 0) ?? 0);

        if (extractedReply.likes_count > 0 || extractedReply.recasts_count > 0 || extractedReply.replies_count > 0 || isOlderThanFourMonths(extractedReply.timestamp)) {
          return extractedReply;
        }
        return null;
      })
      .filter((reply) => reply !== null) as Cast[];
  };

  const initialCastInfo = extractInfo(conversation.cast);

  const directRepliesInfo = conversation.cast.direct_replies ? extractReplies(conversation.cast.direct_replies) : [];

  initialCastInfo.replies_count = directRepliesInfo.length + directRepliesInfo.reduce((acc, r) => acc + r.replies_count, 0);

  const fetchSocialCapitalValues = async (hashes: string[]): Promise<SocialCapitalValueResponse[]> => {
    const requests = hashes.map((hash) => fetchQuery(GET_REPLY_INFO_QUERY, {hash}));

    const responses = await Promise.all(requests);

    return responses.map((response) => {
      if (response.error || !response.data || !response.data.FarcasterReplies || !response.data.FarcasterReplies.Reply[0] || !response.data.FarcasterReplies.Reply[0].socialCapitalValue) {
        return {hash, socialCapitalValue: null};
      }
      return {
        hash: response.data.FarcasterReplies.Reply[0].hash,
        socialCapitalValue: response.data.FarcasterReplies.Reply[0].socialCapitalValue,
      };
    });
  };

  const collectAllHashes = (replies: Cast[]): string[] => {
    return replies.flatMap((reply) => [reply.hash, ...collectAllHashes(reply.direct_replies || [])]);
  };

  const allHashes = collectAllHashes(directRepliesInfo);

  const socialCapitalValues = await fetchSocialCapitalValues(allHashes);

  const addAndFilterSocialCapitalValues = (replies: Cast[], socialValues: SocialCapitalValueResponse[]): Cast[] => {
    return replies
      .map((reply) => {
        const socialValue = socialValues.find((sv) => sv.hash === reply.hash);
        if (socialValue && socialValue.socialCapitalValue && socialValue.socialCapitalValue.formattedValue !== undefined) {
          reply.socialCapitalValue = socialValue.socialCapitalValue.formattedValue;
        } else {
          reply.socialCapitalValue = null;
        }
        reply.direct_replies = addAndFilterSocialCapitalValues(reply.direct_replies || [], socialValues);
        return reply;
      })
      .filter((reply) => reply.socialCapitalValue !== null)
      .sort((a, b) => (b.socialCapitalValue || 0) - (a.socialCapitalValue || 0));
  };

  const enrichedRepliesInfo = addAndFilterSocialCapitalValues(directRepliesInfo, socialCapitalValues);

  const filteredRepliesCount = enrichedRepliesInfo.length + enrichedRepliesInfo.reduce((acc, r) => acc + (r.direct_replies?.length ?? 0), 0);

  const result = {
    initial_cast: initialCastInfo,
    direct_replies: enrichedRepliesInfo,
    total_replies_count: totalRepliesCount,
    filtered_replies_count: filteredRepliesCount,
  };

  return result;
};

export {fetchData};
