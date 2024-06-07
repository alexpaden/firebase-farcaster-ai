import * as functions from "firebase-functions";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: functions.config().openai.api_key,
});

interface Cast {
  text: string;
  direct_replies?: Cast[];
  socialCapitalValue: number | null;
  username: string;
  timestamp: string;
  hash: string;
}

interface Data {
  initial_cast: Cast;
  direct_replies: Cast[];
  total_replies_count: number;
  filtered_replies_count: number;
}

const formatWithOpenAI = async (data: Data, numReplies: number): Promise<any> => {
  try {
    const initialCastText = data.initial_cast.text;
    const usernames: Set<string> = new Set();

    const formatReplies = (replies: Cast[], depth = 0): string => {
      return replies.map((reply, index) => {
        usernames.add(reply.username);
        const formattedReply = `${"  ".repeat(depth)}${index + 1}. ${reply.text}`;
        if (reply.direct_replies && reply.direct_replies.length > 0) {
          const nestedReplies = reply.direct_replies
            .filter((nestedReply: Cast) => nestedReply.socialCapitalValue !== null && nestedReply.socialCapitalValue >= (reply.socialCapitalValue ?? 0))
            .sort((a: Cast, b: Cast) => {
              if (a.socialCapitalValue === null || b.socialCapitalValue === null) {
                return 0;
              }
              return b.socialCapitalValue - a.socialCapitalValue;
            });
          return `${formattedReply}\n${formatReplies(nestedReplies, depth + 1)}`;
        }
        return formattedReply;
      }).join("\n");
    };

    const topReplies = data.direct_replies
      .filter((reply: Cast) => reply.socialCapitalValue !== null)
      .sort((a: Cast, b: Cast) => (b.socialCapitalValue ?? 0) - (a.socialCapitalValue ?? 0))
      .slice(0, numReplies);

    const highlightedReplies = formatReplies(topReplies);

    const prompt = `
Initial cast: ${initialCastText}

Highlighted replies:
${highlightedReplies}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant whose role is to summarize the data in a thread around this conversation in an easy-to-read format
          for quick display in a social app of mobile screen size. Your summary should capture the essence of the replies as they relate to the thread's initial cast.
          Avoid restating what the original cast says, as the author has already read the original post. The summary should be concise and avoid numbering unless it adds clarity.
          Make sure to include any mentions of users (e.g., @perl, @mintit) as they are relevant to the context and engagement, don't include the @. I have provided the top ${numReplies} replies by engagement for you to summarize.
          You are to respond as if you're an informative description, not a conversation participant. DO NOT redescribe the original post or include it in your description. DO NOT enumerate the replies, create a comprehensive short paragraph`,
        },
        {role: "user", content: prompt},
      ],
      temperature: 1,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const threadSummary = response.choices[0]?.message.content?.trim() || "No content";

const result = {
  hash: data.initial_cast.hash,
  cast_timestamp: data.initial_cast.timestamp,
  summary_timestamp: new Date().toISOString(),
  author_username: data.initial_cast.username,
  initial_cast: initialCastText,
  highlighted_replies: highlightedReplies,
  thread_summary: threadSummary,
  highlighted_repliers: Array.from(usernames),
  total_replies_count: data.total_replies_count,
  filtered_replies_count: data.filtered_replies_count,
};

return result;

  } catch (error) {
    console.error("Error formatting with OpenAI:", (error as Error).message);
    throw new Error("Failed to format data with OpenAI");
  }
};

export { formatWithOpenAI };
