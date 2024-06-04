import * as functions from "firebase-functions";
import app from "./thread";

exports.api = functions.https.onRequest(app);
