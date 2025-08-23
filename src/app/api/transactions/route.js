import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb';

// GET transactions (all or by userId)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId"); // e.g. /api/transactions?userId=123

    const { db } = await connectToDatabase();
    const collection = db.collection("transactions");

    let data;
    if (userId) {
      data = await collection.find({ userId }).toArray();
    } else {
      data = await collection.find().toArray();
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST transaction (add new record)
export async function POST(request) {
  try {
    const body = await request.json();

    const { db } = await connectToDatabase();
    const collection = db.collection("transactions");

    const result = await collection.insertOne(body);

    return NextResponse.json({ insertedId: result.insertedId }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
