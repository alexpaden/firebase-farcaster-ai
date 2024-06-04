# Project Setup Instructions

Follow these steps to set up and deploy your Firebase functions.

## Initial Setup

1. **Clone the repository:**
   Use `git clone <your-repo-url>` to clone the repository to your local machine.

2. **Change directory to the functions folder:**
   Enter the directory with `cd /functions`.

3. **Install dependencies:**
   Run `npm install` to install the necessary packages using npm. If you prefer using yarn, you can use `yarn install` instead.

4. **Install Firebase Tools globally:**
   If you don't have Firebase Tools installed, run `npm install -g firebase-tools` to install it globally.

## Configuration

5. **Set environment variables for Firebase:**
   Set the necessary API keys for your project with the following command:
   `firebase functions:config:set airstack.api_key="your_airstack_api_key" neynar.api_key="your_neynar_api_key" openai.api_key="your_openai_api_key"`
   Replace the placeholders with your actual API keys.

## Testing and Deployment

6. **Test locally with the Firebase emulator:**
    To setup firebase env vars for localhost run `functions:config:get > .runtimeconfig.json`

   Run in localhost with `firebase emulators:start --only functions`.

7. **Deploy to Firebase:**
   Deploy your functions to Firebase using `firebase deploy --only functions`. This command ensures that only your functions are deployed.
