export function authErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;

  switch (code) {
    case "otp_expired":
      return "O link de confirmação expirou. Cadastre-se novamente para receber um novo.";
    case "access_denied":
      return "Link inválido ou já utilizado.";
    case "confirm_failed":
      return "Não foi possível confirmar seu e-mail. Tente novamente.";
    default:
      return "Ocorreu um erro na autenticação. Tente novamente.";
  }
}
