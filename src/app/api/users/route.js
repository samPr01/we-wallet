import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb';

// GET - Fetch all users
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('users');
    
    const users = await collection.find({}).sort({ joinDate: -1 }).toArray();
    
    return NextResponse.json({
      success: true,
      users: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request) {
  try {
    const body = await request.json();
    const { walletAddress, userId } = body;
    
    if (!walletAddress || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: walletAddress, userId' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection('users');
    
    // Check if user already exists
    const existingUser = await collection.findOne({ 
      walletAddress: walletAddress.toLowerCase() 
    });
    
    if (existingUser) {
      return NextResponse.json({
        success: true,
        user: existingUser,
        message: 'User already exists'
      });
    }
    
    // Create new user
    const newUser = {
      walletAddress: walletAddress.toLowerCase(),
      userId: userId,
      joinDate: new Date(),
      lastActivity: new Date(),
      totalDeposits: 0,
      totalWithdrawals: 0,
      status: 'active'
    };
    
    const result = await collection.insertOne(newUser);
    newUser._id = result.insertedId;
    
    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT - Update user activity
export async function PUT(request) {
  try {
    const body = await request.json();
    const { walletAddress } = body;
    
    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing walletAddress' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection('users');
    
    const result = await collection.updateOne(
      { walletAddress: walletAddress.toLowerCase() },
      { 
        $set: { 
          lastActivity: new Date() 
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'User activity updated successfully'
    });
  } catch (error) {
    console.error('Error updating user activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user activity' },
      { status: 500 }
    );
  }
}
