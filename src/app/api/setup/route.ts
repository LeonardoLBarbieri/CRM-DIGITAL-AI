import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Verifica se já existe algum gerente
    const managerExists = await prisma.user.findFirst({
      where: { role: "GERENTE" }
    });

    if (managerExists) {
      return NextResponse.json({ message: "Gerente já existe." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash("gerente123", 10);

    const newManager = await prisma.user.create({
      data: {
        name: "Gerente Principal",
        email: "gerente@sistema.com",
        password: hashedPassword,
        role: "GERENTE"
      }
    });

    return NextResponse.json({ 
      message: "Gerente criado com sucesso!", 
      email: newManager.email,
      password: "gerente123" // Apenas para exibição inicial!
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar gerente" }, { status: 500 });
  }
}
