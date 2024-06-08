# Project Setup Instructions

Follow these steps to set up and deploy your Firebase functions.

## Initial Setup

1. **Clone the repository:**  
   Use `git clone https://github.com/alexpaden/firebase-farcaster-ai` to clone the repository to your local machine.

2. **Change directory to the functions folder:**  
   Enter the directory with `cd /functions`.

3. **Install dependencies:**  
   Run `yarn` to install the necessary packages using yarn.

4. **Install Firebase Tools globally:**  
   If you don't have Firebase Tools installed, run `npm install -g firebase-tools` to install it globally.

## Configuration

5. **Set environment variables for Firebase:**  
   Set the necessary API keys for your project with the following command:  
   `firebase functions:config:set airstack.api_key="your_airstack_api_key" neynar.api_key="your_neynar_api_key" openai.api_key="your_openai_api_key"`  
   Replace the placeholders with your actual API keys.

## Testing and Deployment

6. **Test locally with the Firebase emulator:**  
   To set up Firebase environment variables for localhost, run `firebase functions:config:get > .runtimeconfig.json`.  
   Then start the emulator with `yarn serve`.

7. **Deploy to Firebase:**  
   Deploy your functions to Firebase using `yarn deploy`.

## Using the API

### Retrieve Thread Data

**Endpoint:** `/thread`

**Method:** GET

**Query Parameters:**
- `hash` (required): The unique hash identifier for the thread.
- `replies`: The number of premium replies to include in the summary using social capital scores by airstack.xyz and cast data by neynar.xyz.
- `refresh`: Whether to generate a new summary or grab the existing one from the Firestore database. Valid values are `true` or `false`.

**Example Request:**  
http://127.0.0.1:5001/test-3851e/us-central1/api/thread?hash=0x9f62853b63ddf0a2e9caadda7095b0a7b97331b9&replies=5&refresh=true


**Example Response:**
```json
{
  "hash": "0x9f62853b63ddf0a2e9caadda7095b0a7b97331b9",
  "cast_timestamp": "2024-06-07T01:52:13.000Z",
  "summary_timestamp": "2024-06-07T23:51:58.202Z",
  "author_username": "zinger",
  "initial_cast": "My mental model for Farcaster:\n\n“programmable social” = what it is\n“decentralized social” = how it works\n\nThe former attracts the users, the latter attracts the builders",
  "highlighted_replies": "1. I like it\n\nI also like borderless or boundless social for what it is.\n\nTake your identity and social graph with you as you travel throughout the internet\n2. Programmable money also hits harder than decentralized finance. \n\nSo ya I like it\n3. nitpick: programmable social attracts devs who make extensions / applets that attract users\n4. True facts right there 🫡 53 $degen\n  1. One of best answer 🥰\n5. You are right bro the former attracts the users,the letter attracts the builders but everyone attraction in the money😱😍😍",
  "thread_summary": "Users express their appreciation of the mental model, with suggestions like \"borderless social\" to emphasize fluid online identities. Comparisons are made to terms like \"programmable money\" hitting harder than \"decentralized finance\" for user appeal. One user points out that \"programmable social\" specifically attracts developers who create user-attracting extensions. A few comments agree strongly, mentioning the universal allure of money.",
  "highlighted_repliers": [
    "adrienne",
    "langchain",
    "sonyasupposedly",
    "codymayer22",
    "alizabeth"
  ],
  "total_replies_count": 18,
  "filtered_replies_count": 6,
  "socialCapitalValue": 912.61749022785
}
```

### Retrieve Channel Data

**Endpoint:** `/channel`

**Method:** GET

**Query Parameters:**
- `channelId` (required): The unique identifier for the channel.
- `threadCount`: The number of threads to process in the channel when sorted by highest social capital value first.
- `refresh`: Whether to generate a new summary or grab the existing one from the Firestore database. Valid values are `true` or `false`.
- `timeFrame`: The time frame for trending casts. Valid values are `day` or `week`.

**Example Request:**  
`http://127.0.0.1:5001/test-3851e/us-central1/api/channel?channelId=data&threadCount=2&refresh=true&timeFrame=week`

**Example Response:**
```json
{
  "channel_id": "data",
  "number_of_threads_used": 2,
  "time_frame": "week",
  "summary_timestamp": "2024-06-07",
  "top_thread_summaries": [
    {
      "hash": "0x55ea635b711bf97a0d53ce8b35e4acf80971c91b",
      "cast_timestamp": "2024-06-02T23:52:07.000Z",
      "summary_timestamp": "2024-06-07T23:53:22.955Z",
      "author_username": "beachcrypto",
      "initial_cast": "top 5000 following profiles according to global openrank as of june 2, 2024 4:45pm pst\nhttps://docs.google.com/spreadsheets/d/1X_IYYJ6P_ijF5YiRvuwxoA4a-W9muHZ8Q0JB5q1OAh8",
      "highlighted_replies": "1. Really appreciate you sharing 🙏\n\n2000 $degen\n2. 334 $degen\ndo they post these or are you paying to pull them down?\n\n3. 99 percentile gang!\n\n10 $degen\n4. where did you get this dude?\n\n5. 99 percentile gang 10 $DEGEN\n  1. @dwr.eth follows you 😉\n",
      "thread_summary": "Users express gratitude for sharing the list, while some inquire about the source and whether there is a cost associated. Engagement around being in the '99 percentile gang' is noted, with mentions that certain followers (@dwr.eth) are included.",
      "highlighted_repliers": [
        "andremessina",
        "0xt0ny",
        "degenveteran.eth",
        "nikdmello",
        "totty.eth",
        "beachcrypto"
      ],
      "total_replies_count": 20,
      "filtered_replies_count": 14,
      "socialCapitalValue": 776.718523445655
    },
    .
    .
    .
    {
      "hash": "0xb077e2a10efb4a68078e1c108b39c97938cc67d3",
      "cast_timestamp": "2024-06-07T21:25:28.000Z",
      "summary_timestamp": "2024-06-07T23:53:23.057Z",
      "author_username": "darenmatsuoka",
      "initial_cast": "The number of mobile wallet users in crypto is now at an all time high of 28 million, according to the data from our State of Crypto Index. This is a good indicator that the industry’s UX improvements are bringing more mainstream users into the space.",
      "highlighted_replies": "",
      "thread_summary": "Fintech_dev highlights the importance of better security measures to protect newcomers. CryptoLover remarks on how increased usability is key to wider adoption, stressing continued UX improvements. TechGuru suggests this growth could attract more developers to the industry. Mintit comments on the role of educational resources in onboarding new users effectively. Pearl adds that this surge in users should encourage businesses to offer more mobile-friendly crypto services.",
      "highlighted_repliers": [],
      "total_replies_count": 0,
      "filtered_replies_count": 0,
      "socialCapitalValue": 537.5473295737199
    }
  ],
  "channel_summary": "Explore the latest top 5000 OpenRank crypto profiles shared by beachcrypto, sparking thanks and discussions on follower status and included profiles. Darenmatsuoka highlights a record 28 million mobile wallet users, citing UX enhancements. Conversations emphasize security, usability, developer attraction, educational resources, and business potential in mobile-friendly crypto services."
}
```


