import * as functions from "firebase-functions";
import OpenAI from "openai";
import {UserSummary} from "./processUser";

const openai = new OpenAI({
  apiKey: functions.config().openai.api_key,
});

const formatUserSummaryWithOpenAI = async (userSummary: UserSummary, username: string): Promise<string> => {
  try {
    const narrativeThreads = userSummary.preferred_threads.map((thread) => {
      const formattedDate = thread.cast_timestamp ? new Date(thread.cast_timestamp).toLocaleDateString() : "Date Unknown";
      return `"${thread.initial_cast}" on ${formattedDate} (${thread.thread_summary}), highlighted replies: ${thread.highlighted_replies}.`;
    }).join(" ");

    const channelDetails = userSummary.preferred_channels.map((channel) => `${channel.channelId}: ${channel.count} threads`).join(", ");
    const prompt = `Create a concise biography for ${username}, actively contributing to channels like ${channelDetails}. Key discussions include: ${narrativeThreads} Summarize this succinctly for a mobile screen.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Craft a concise, flowing biography for a user named ${username}, who participates actively in various community channels. As you prepare to write, keep in mind the following rules:
          1. **Highlight Contributions:** Clearly outline the nature of ${username}'s contributions across the discussions. Focus on key interactions that showcase their engagement and insight.
          2. **Maintain a Measured Tone:** Keep the biography's tone professional and measured. Avoid grandiose language and excessive praise. Instead, opt for a realistic portrayal of their activities.
          3. **Fact-Based Narrative:** Base the summary on factual and genuine engagement. Do not overstate their impact or contributions. Provide an honest and accurate depiction of their involvement.
          4. **Smooth Narrative Flow:** Ensure that the biography flows smoothly as a single, cohesive paragraph. Avoid bullet points or list formats. The narrative should read like a brief, engaging story of notable interactions.
          5. **Discretion in Content Selection:** Given that you will have between 10 and 50 threads to consider, use discretion to select the most meaningful threads. Do not feel compelled to include details from all threads; focus on those that best represent ${username}'s impact and relevance.
          6. **Professional Atmosphere:** Reflect a professional and youthful atmosphere suitable for entrepreneurs and young adults. The language and examples chosen should resonate with this audience.
          7. **Avoid Ego Inflation:** Be careful not to inflate ${username}'s achievements. While it's important to acknowledge their contributions, ensure that any commendation is warranted and proportionate.
          8. **Include a few important dates:** Thread dates are important for constructive a narrative but don't overuse them. DO NOT include more than 3 dates, pick the most important ones given the rules listed above!.
          9. **Mobile Accessibility:** Finally, craft the summary to be easily readable on a mobile screen. The text should be concise and easily digestible, allowing for quick comprehension in a mobile-first environment`,
        },
        {role: "user", content: prompt},
      ],
      temperature: 0.7,
      max_tokens: 512,
      top_p: 1,
      frequency_penalty: 0.15,
      presence_penalty: 0,
    });

    const userSummaryText = response.choices[0]?.message.content?.trim() || "No content available";

    return userSummaryText;
  } catch (error) {
    console.error("Error formatting with OpenAI:", (error as Error).message);
    throw new Error("Failed to format user data with OpenAI");
  }
};

export {formatUserSummaryWithOpenAI};
