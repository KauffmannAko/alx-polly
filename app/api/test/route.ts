import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    method: 'GET'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ 
      message: 'API is working',
      timestamp: new Date().toISOString(),
      method: 'POST',
      receivedData: body
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to parse JSON',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ 
      message: 'API is working',
      timestamp: new Date().toISOString(),
      method: 'PUT',
      receivedData: body
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to parse JSON',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}
