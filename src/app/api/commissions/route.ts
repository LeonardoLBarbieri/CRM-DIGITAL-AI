import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all commissions
export async function GET() {
  try {
    const commissions = await prisma.commission.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(commissions);
  } catch (error) {
    console.error('Error fetching commissions:', error);
    return NextResponse.json({ error: 'Erro ao buscar comissões' }, { status: 500 });
  }
}

// POST create commission
export async function POST(req: Request) {
  try {
    const { description, amount, type, date } = await req.json();
    if (!description || !amount || !date) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }
    const commission = await prisma.commission.create({
      data: { description, amount: parseFloat(amount), type: type || 'income', date },
    });
    return NextResponse.json(commission, { status: 201 });
  } catch (error) {
    console.error('Error creating commission:', error);
    return NextResponse.json({ error: 'Erro ao criar registro' }, { status: 500 });
  }
}

// DELETE commission
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.commission.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting commission:', error);
    return NextResponse.json({ error: 'Erro ao deletar registro' }, { status: 500 });
  }
}
