import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI);

// GET transactions (all or by userId)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId"); // e.g. /api/transactions?userId=123

    await client.connect();
    const db = client.db("crypto"); // change "crypto" if your DB name is different
    const collection = db.collection("transactions");

    let data;
    if (userId) {
      data = await collection.find({ userId }).toArray();
    } else {
      data = await collection.find().toArray();
    }

    return Response.json(data, { status: 200 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST transaction (add new record)
export async function POST(request) {
  try {
    const body = await request.json();

    await client.connect();
    const db = client.db("crypto"); // change "crypto" if your DB name is different
    const collection = db.collection("transactions");

    const result = await collection.insertOne(body);

    return Response.json({ insertedId: result.insertedId }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
