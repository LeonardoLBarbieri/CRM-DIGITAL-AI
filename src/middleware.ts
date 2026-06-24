import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Redireciona usuários sem sessão para o login (já feito automaticamente pelo withAuth)
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Retorna true se houver token (logado)
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Protege apenas as rotas dentro de /app
export const config = {
  matcher: ["/app/:path*"],
};
