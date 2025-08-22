import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';

// GET - Fetch all withdrawals
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('withdrawals');
    
    const withdrawals = await collection.find({}).sort({ requestDate: -1 }).toArray();
    
    return NextResponse.json({
      success: true,
      withdrawals: withdrawals,
      count: withdrawals.length
    });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
}

// POST - Create new withdrawal
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, walletAddress, token, amount, destinationAddress, transferMethod } = body;
    
    if (!userId || !walletAddress || !token || !amount || !destinationAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, walletAddress, token, amount, destinationAddress' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const withdrawalsCollection = db.collection('withdrawals');
    const usersCollection = db.collection('users');
    
    // Create new withdrawal
    const newWithdrawal = {
      userId: userId,
      walletAddress: walletAddress.toLowerCase(),
      token: token,
      amount: parseFloat(amount),
      destinationAddress: destinationAddress,
      transferMethod: transferMethod || 'server-side',
      status: 'pending',
      requestDate: new Date(),
      processedDate: null,
      transactionHash: null,
      adminNotes: ''
    };
    
    const result = await withdrawalsCollection.insertOne(newWithdrawal);
    newWithdrawal._id = result.insertedId;
    
    // Update user's total withdrawals
    await usersCollection.updateOne(
      { userId: userId },
      { 
        $inc: { 
          totalWithdrawals: parseFloat(amount) 
        } 
      }
    );
    
    return NextResponse.json({
      success: true,
      withdrawal: newWithdrawal,
      message: 'Withdrawal created successfully'
    });
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create withdrawal' },
      { status: 500 }
    );
  }
}

// PUT - Update withdrawal status
export async function PUT(request) {
  try {
    const body = await request.json();
    const { withdrawalId, status, adminNotes, transactionHash } = body;
    
    if (!withdrawalId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: withdrawalId, status' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection('withdrawals');
    
    const updateData = {
      status: status,
      processedDate: new Date(),
      adminNotes: adminNotes || ''
    };
    
    if (transactionHash) {
      updateData.transactionHash = transactionHash;
    }
    
    const result = await collection.updateOne(
      { _id: withdrawalId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Withdrawal not found' },
        { status: 404 }
      );
    }
    
    // Get updated withdrawal
    const updatedWithdrawal = await collection.findOne({ _id: withdrawalId });
    
    return NextResponse.json({
      success: true,
      withdrawal: updatedWithdrawal,
      message: `Withdrawal ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating withdrawal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update withdrawal' },
      { status: 500 }
    );
  }
}
