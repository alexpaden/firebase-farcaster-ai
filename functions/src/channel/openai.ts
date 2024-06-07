import * as functions from "firebase-functions";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: functions.config().openai.api_key,
});

interface ThreadSummary {
  author_username: string;
  initial_cast: string;
  thread_summary: string;
}

const formatChannelSummaryWithOpenAI = async (threads: ThreadSummary[], channelId:string, numThreads: number): Promise<any> => {
  try {
    const formattedThreads = threads.slice(0, numThreads).map((thread, index) => (
      `${index + 1}.\nAuthor: ${thread.author_username}\nOriginal: ${thread.initial_cast}\nSummary: ${thread.thread_summary}\n`
    )).join("\n");

    const prompt = `List of ${numThreads} threads in ${channelId} channel:\n\n${formattedThreads}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant whose role is to summarize the data in a social media channel in an easy-to-read format for quick
           display in a social app of mobile screen size. Your summary should capture the essence of the threads as they relate to the channel's content.
           Avoid restating the original cast, focus on the context of the original text and reply summary together. Do not focus on mentioning users based on the reply summary.
           The summary should be concise and avoid numbering unless it adds clarity. Make sure to note any trending discourse across multiple threads if applicable.
           You are to respond as if you're an informative ad description, not a conversation participant. 
           DO NOT redescribe the original post or include it in your description. DO NOT enumerate the replies, create a comprehensive short paragraph.
           Be laconic and avoid repetition, numbering, AND filler words wherever possible. Be short, combine descriptions if possible. Short attention span audience.
           `,
        },
        { role: "user", content: prompt },
      ],
      temperature: 1,
      max_tokens: 512,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const channelSummary = response.choices[0]?.message.content?.trim() || "No content";

    return {
      prompt,
      channel_summary: channelSummary,
    };
  } catch (error) {
    console.error("Error formatting with OpenAI:", (error as Error).message);
    throw new Error("Failed to format channel data with OpenAI");
  }
};

export { formatChannelSummaryWithOpenAI };
