import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Redireciona usuários sem sessão para o login (já feito automaticamente pelo withAuth)
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => true, // Retorna true sempre para desabilitar o login temporariamente
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Protege apenas as rotas dentro de /app (comentado temporariamente)
export const config = {
  // matcher: ["/app/:path*"],
};
