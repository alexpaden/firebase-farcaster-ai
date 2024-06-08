import * as express from "express";
import {processChannel} from "./processChannel";

const router = express.Router();

router.get("/", async (req, res) => {
  const {channelId, threadCount = 3, refresh, timeFrame} = req.query;

  if (!channelId) {
    return res.status(400).send("Missing required parameter: channelId");
  }

  if (!timeFrame || (timeFrame !== "day" && timeFrame !== "week")) {
    return res.status(400).send("Invalid or missing timeFrame parameter. Choose 'day' or 'week'.");
  }

  const numThreads = parseInt(threadCount as string, 10);
  const shouldRefresh = refresh === "true";

  try {
    const result = await processChannel(channelId as string, numThreads, shouldRefresh, timeFrame as "day" | "week");
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error processing channel:", error);
    return res.status(500).send("Internal Server Error");
  }
});

export default router;
