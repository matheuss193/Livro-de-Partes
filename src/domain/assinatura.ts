/**
 * Confirmação da assinatura eletrônica. Na demonstração (sem servidor) qualquer PIN de 4 a 6
 * dígitos é aceito; na fase 2 a confirmação passa a ser a senha do usuário autenticado.
 */
export const pinValido = (pin: string): boolean => /^\d{4,6}$/.test(pin)
