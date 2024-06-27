import * as express from "express";
import * as functions from "firebase-functions";
import threadRoutes from "./thread";
import channelRoutes from "./channel";
import userRoutes from "./user";

const app = express();
app.use(express.json());

app.use("/thread", threadRoutes);
app.use("/channel", channelRoutes);
app.use("/user", userRoutes);

exports.api = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '512MB'
  })
  .https.onRequest(app);
