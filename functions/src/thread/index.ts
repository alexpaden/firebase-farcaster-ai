import * as admin from 'firebase-admin';
import * as express from 'express';
import { fetchData } from './fetchData';
import { formatWithOpenAI } from './openai';


admin.initializeApp();
const app = express();
const db = admin.firestore();

app.use(express.json());

app.get('/thread', async (req, res) => {
  const { hash, replies, refresh } = req.query;

  if (!hash) {
    return res.status(400).send('Missing required parameter: hash');
  }

  const numReplies = replies ? parseInt(replies as string, 10) : 5;
  const shouldRefresh = refresh === 'true';

  try {
    const docRef = db.collection('threads').doc(hash as string);
    let result;

    if (shouldRefresh) {
      result = await fetchData(hash as string);
      const formattedResult = await formatWithOpenAI(result, numReplies);
      await docRef.set(formattedResult);
      return res.status(200).json(formattedResult);
    }

    const doc = await docRef.get();
    if (doc.exists) {
      result = doc.data();
    } else {
      result = await fetchData(hash as string);
      const formattedResult = await formatWithOpenAI(result, numReplies);
      await docRef.set(formattedResult);
      return res.status(200).json(formattedResult);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).send('Internal Server Error');
  }
});

export default app;
