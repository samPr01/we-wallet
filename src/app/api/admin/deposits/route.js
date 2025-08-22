import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';

// GET - Fetch all deposits
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('deposits');
    
    const deposits = await collection.find({}).sort({ submissionDate: -1 }).toArray();
    
    return NextResponse.json({
      success: true,
      deposits: deposits,
      count: deposits.length
    });
  } catch (error) {
    console.error('Error fetching deposits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deposits' },
      { status: 500 }
    );
  }
}

// POST - Create new deposit
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, walletAddress, token, amount, transactionHash, screenshot } = body;
    
    if (!userId || !walletAddress || !token || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, walletAddress, token, amount' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const depositsCollection = db.collection('deposits');
    const usersCollection = db.collection('users');
    
    // Create new deposit
    const newDeposit = {
      userId: userId,
      walletAddress: walletAddress.toLowerCase(),
      token: token,
      amount: parseFloat(amount),
      transactionHash: transactionHash || '',
      screenshot: screenshot || null,
      status: 'pending',
      submissionDate: new Date(),
      processedDate: null,
      adminNotes: ''
    };
    
    const result = await depositsCollection.insertOne(newDeposit);
    newDeposit._id = result.insertedId;
    
    // Update user's total deposits
    await usersCollection.updateOne(
      { userId: userId },
      { 
        $inc: { 
          totalDeposits: parseFloat(amount) 
        } 
      }
    );
    
    return NextResponse.json({
      success: true,
      deposit: newDeposit,
      message: 'Deposit created successfully'
    });
  } catch (error) {
    console.error('Error creating deposit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create deposit' },
      { status: 500 }
    );
  }
}

// PUT - Update deposit status
export async function PUT(request) {
  try {
    const body = await request.json();
    const { depositId, status, adminNotes, transactionHash } = body;
    
    if (!depositId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: depositId, status' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection('deposits');
    
    const updateData = {
      status: status,
      processedDate: new Date(),
      adminNotes: adminNotes || ''
    };
    
    if (transactionHash) {
      updateData.transactionHash = transactionHash;
    }
    
    const result = await collection.updateOne(
      { _id: depositId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Deposit not found' },
        { status: 404 }
      );
    }
    
    // Get updated deposit
    const updatedDeposit = await collection.findOne({ _id: depositId });
    
    return NextResponse.json({
      success: true,
      deposit: updatedDeposit,
      message: `Deposit ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating deposit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update deposit' },
      { status: 500 }
    );
  }
}
