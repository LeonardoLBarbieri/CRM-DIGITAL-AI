import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: Request) {
  try {
    // Auth temporariamente desabilitado
    // const session = await getServerSession(authOptions)
    // if (!session || (session.user as any).role !== "GERENTE") {
    //   return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    // }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuários.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    // Auth temporariamente desabilitado
    // const session = await getServerSession(authOptions)
    // if (!session || (session.user as any).role !== "GERENTE") {
    //   return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    // }

    const { name, email, password, role } = await req.json()
    const bcrypt = require("bcrypt")
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "CORRETOR"
      },
      select: { id: true, name: true, email: true, role: true }
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar usuário.' }, { status: 500 })
  }
}
