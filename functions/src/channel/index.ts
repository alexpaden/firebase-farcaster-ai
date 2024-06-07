import * as express from "express";
import { processChannel } from "./processChannel";

const router = express.Router();

router.get("/", async (req, res) => {
    const { channel_id, thread_count = 3, refresh, time_frame } = req.query;

    if (!channel_id) {
        return res.status(400).send("Missing required parameter: channel_id");
    }

    if (!time_frame || (time_frame !== 'day' && time_frame !== 'week')) {
        return res.status(400).send("Invalid or missing time_frame parameter. Choose 'day' or 'week'.");
    }

    const numThreads = parseInt(thread_count as string, 10);
    const shouldRefresh = refresh === "true";

    try {
        const result = await processChannel(channel_id as string, numThreads, shouldRefresh, time_frame as 'day' | 'week');
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error processing channel:", error);
        return res.status(500).send("Internal Server Error");
    }
});

export default router;
