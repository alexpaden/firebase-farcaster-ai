import * as express from "express";
import * as functions from "firebase-functions";
import threadRoutes from "./thread";  // Assuming thread exports its express.Router()
import channelRoutes from "./channel";  // Assuming channel exports its express.Router()

const app = express();
app.use(express.json());

// Mount the thread and channel routes
app.use('/thread', threadRoutes);
app.use('/channel', channelRoutes);

exports.api = functions.https.onRequest(app);
