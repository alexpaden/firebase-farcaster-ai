import * as express from "express";
import * as functions from "firebase-functions";
import threadRoutes from "./thread";
import channelRoutes from "./channel";

const app = express();
app.use(express.json());

app.use("/thread", threadRoutes);
app.use("/channel", channelRoutes);

exports.api = functions.https.onRequest(app);
