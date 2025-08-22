import { NextResponse } from 'next/server';

// Mock data storage (in a real app, this would be a database)
let deposits = [];
let users = [];

// Load data from localStorage (this is a simplified approach)
const loadData = () => {
  if (typeof window !== 'undefined') {
    try {
      const storedDeposits = localStorage.getItem('walletbase_deposits');
      const storedUsers = localStorage.getItem('walletbase_users');
      
      if (storedDeposits) deposits = JSON.parse(storedDeposits);
      if (storedUsers) users = JSON.parse(storedUsers);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }
};

// Save data to localStorage
const saveData = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('walletbase_deposits', JSON.stringify(deposits));
      localStorage.setItem('walletbase_users', JSON.stringify(users));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }
};

// GET - Fetch all deposits
export async function GET() {
  try {
    loadData();
    
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
    
    loadData();
    
    // Validate required fields
    if (!userId || !walletAddress || !token || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new deposit
    const newDeposit = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      userId,
      walletAddress,
      token,
      amount: parseFloat(amount),
      transactionHash: transactionHash || '',
      screenshot: screenshot || null,
      status: 'pending',
      submissionDate: new Date().toISOString(),
      processedDate: null,
      adminNotes: ''
    };
    
    deposits.push(newDeposit);
    saveData();
    
    // Update user's total deposits
    const userIndex = users.findIndex(user => user.userId === userId);
    if (userIndex !== -1) {
      users[userIndex].totalDeposits += parseFloat(amount);
      saveData();
    }
    
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
    
    loadData();
    
    const depositIndex = deposits.findIndex(deposit => deposit.id === depositId);
    if (depositIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Deposit not found' },
        { status: 404 }
      );
    }
    
    // Update deposit
    deposits[depositIndex].status = status;
    deposits[depositIndex].processedDate = new Date().toISOString();
    deposits[depositIndex].adminNotes = adminNotes || '';
    
    if (transactionHash) {
      deposits[depositIndex].transactionHash = transactionHash;
    }
    
    saveData();
    
    return NextResponse.json({
      success: true,
      deposit: deposits[depositIndex],
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
