import { NextResponse } from 'next/server';

// Mock data storage (in a real app, this would be a database)
let withdrawals = [];
let users = [];

// Load data from localStorage (this is a simplified approach)
const loadData = () => {
  if (typeof window !== 'undefined') {
    try {
      const storedWithdrawals = localStorage.getItem('walletbase_withdrawals');
      const storedUsers = localStorage.getItem('walletbase_users');
      
      if (storedWithdrawals) withdrawals = JSON.parse(storedWithdrawals);
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
      localStorage.setItem('walletbase_withdrawals', JSON.stringify(withdrawals));
      localStorage.setItem('walletbase_users', JSON.stringify(users));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }
};

// GET - Fetch all withdrawals
export async function GET() {
  try {
    loadData();
    
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
    
    loadData();
    
    // Validate required fields
    if (!userId || !walletAddress || !token || !amount || !destinationAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new withdrawal
    const newWithdrawal = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      userId,
      walletAddress,
      token,
      amount: parseFloat(amount),
      destinationAddress,
      transferMethod: transferMethod || 'server-side',
      status: 'pending',
      requestDate: new Date().toISOString(),
      processedDate: null,
      transactionHash: null,
      adminNotes: ''
    };
    
    withdrawals.push(newWithdrawal);
    saveData();
    
    // Update user's total withdrawals
    const userIndex = users.findIndex(user => user.userId === userId);
    if (userIndex !== -1) {
      users[userIndex].totalWithdrawals += parseFloat(amount);
      saveData();
    }
    
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
    
    loadData();
    
    const withdrawalIndex = withdrawals.findIndex(withdrawal => withdrawal.id === withdrawalId);
    if (withdrawalIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Withdrawal not found' },
        { status: 404 }
      );
    }
    
    // Update withdrawal
    withdrawals[withdrawalIndex].status = status;
    withdrawals[withdrawalIndex].processedDate = new Date().toISOString();
    withdrawals[withdrawalIndex].adminNotes = adminNotes || '';
    
    if (transactionHash) {
      withdrawals[withdrawalIndex].transactionHash = transactionHash;
    }
    
    saveData();
    
    return NextResponse.json({
      success: true,
      withdrawal: withdrawals[withdrawalIndex],
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
