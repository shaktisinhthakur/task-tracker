import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

export async function GET() {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const columns = await prisma.credentialColumn.findMany({ orderBy: { order: 'asc' } });
    const rows = await prisma.credentialRow.findMany({
      include: {
        cells: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Decrypt cell values
    const decryptedRows = rows.map(row => ({
      ...row,
      cells: row.cells.map(cell => ({
        ...cell,
        value: decrypt(cell.value)
      }))
    }));

    return NextResponse.json({ columns, rows: decryptedRows });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action, payload } = await request.json();

  try {
    if (action === 'ADD_COLUMN') {
      const colCount = await prisma.credentialColumn.count();
      const col = await prisma.credentialColumn.create({
        data: { name: payload.name, order: colCount }
      });
      return NextResponse.json(col);
    } 
    
    if (action === 'ADD_ROW') {
      const row = await prisma.credentialRow.create({
        data: { createdById: user.id }
      });
      return NextResponse.json({ ...row, cells: [] });
    }

    if (action === 'UPDATE_CELL') {
      const { rowId, columnId, value } = payload;
      const encryptedValue = encrypt(value);

      const cell = await prisma.credentialCell.upsert({
        where: { rowId_columnId: { rowId, columnId } },
        update: { value: encryptedValue },
        create: { rowId, columnId, value: encryptedValue }
      });

      return NextResponse.json({ ...cell, value });
    }

    if (action === 'DELETE_ROW') {
      await prisma.credentialRow.delete({ where: { id: payload.rowId } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
