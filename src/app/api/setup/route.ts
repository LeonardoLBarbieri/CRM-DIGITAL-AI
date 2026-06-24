import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function GET(request: Request) {
  try {
    const hashedPassword = await bcrypt.hash("123456", 10);

    // 1. Garante Gerente
    let manager = await prisma.user.findUnique({ where: { email: "gerente@sistema.com" } });
    if (!manager) {
      manager = await prisma.user.create({
        data: {
          name: "Gerente Principal",
          email: "gerente@sistema.com",
          password: hashedPassword,
          role: "GERENTE"
        }
      });
    }

    // 2. Garante Corretor
    let broker = await prisma.user.findUnique({ where: { email: "corretor@sistema.com" } });
    if (!broker) {
      broker = await prisma.user.create({
        data: {
          name: "Corretor Demo",
          email: "corretor@sistema.com",
          password: hashedPassword,
          role: "CORRETOR"
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      message: "Contas de demonstração prontas!"
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao preparar contas" }, { status: 500 });
  }
}
