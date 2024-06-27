import * as express from "express";
import {processUser} from "./processUser";

const router = express.Router();

router.get("/", async (req, res) => {
  const {username, threads = 20, refresh} = req.query;

  if (!username) {
    return res.status(400).send("Missing required parameter: username");
  }

  const threadCount = parseInt(threads as string, 10);
  const shouldRefresh = refresh === "false";

  try {
    const result = await processUser(username as string, threadCount, shouldRefresh);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error processing user:", error);
    return res.status(500).send("Internal Server Error");
  }
});

export default router;
