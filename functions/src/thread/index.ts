import * as express from "express";
import {processThread} from "./processThread";

const router = express.Router();

router.get("/", async (req, res) => {
  const {hash, replies, refresh, prompt} = req.query;

  if (!hash) {
    return res.status(400).send("Missing required parameter: hash");
  }

  const numReplies = replies ? parseInt(replies as string, 10) : 5;
  const shouldRefresh = refresh === "true";
  const userPrompt = prompt ? prompt as string : "default";

  const result = await processThread(hash as string, numReplies, shouldRefresh, userPrompt);

  if (result.error) {
    return res.status(500).send(result.error);
  }

  return res.status(200).json(result);
});

export default router;
