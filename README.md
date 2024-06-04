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

**Description:**  
Fetches thread data from Firebase, optionally refreshes the data by calling external APIs and summarizing the data using OpenAI's services.

**Query Parameters:**
- `hash` (required): The unique hash identifier for the thread.
- `replies`: The number of premium replies to include in the summary using social capital scores by airstack.xyz and cast data by neynar.xyz.
- `refresh`: Whether to generate a new summary or grab the existing one from the Firestore database. Valid values are `true` or `false`.

**Example Request:**  
http://127.0.0.1:5001/test-3851e/us-central1/api/thread?hash=0x6c5dea44f96bd0fdcccf0dc9b8d506115cb35734&replies=7&refresh=false


**Example Response:**
```json
{
  "hash": "0x6c5dea44f96bd0fdcccf0dc9b8d506115cb35734",
  "timestamp": "2022-11-18T20:46:51.000Z",
  "prompt": "\n  Initial cast: This is a test fweet (or whatever term the farcaster marketing department came up with to make its tweets sound like something different and original)\n\nHullo world!\n\n  Direct replies:\n  1. marketing has not been this unhappy since someone tried to use the word farc to describe farcaster users\n2. farcaster marketing department be like: https://i.imgur.com/7wjhmYE.png\n3. @perl\n4. @perl Vitalik joins Farcaster. Finally! #Vitalik #Farcaster\n\n5. @mintit\n\n6. the marketing dept makes us say \"cast\" instead of tweet\n7. Wait so it’s a Vitalik thread but no bots..? Where are the bots??\n",
  "thread_summary": "Replies revolve around the playful tone of the initial cast: \n\n- Users joke about marketing's dislike for terms like \"farc\" to describe Farcaster users.\n- A popular meme is shared to represent the marketing department's reaction.\n- @perl and @mintit are tagged, indicating high engagement or relevance.\n- The term \"cast\" is confirmed as the preferred term over \"tweet.\"\n- Discussions touch on Vitalik's presence on Farcaster, with curiosity about the absence of bots.",
  "highlighted_authors": [
    "v",
    "macbudkowski",
    "gridbased",
    "ace",
    "benersing",
    "emodi",
    "pts"
  ],
  "total_replies_count": 214,
  "filtered_replies_count": 22
}
```


