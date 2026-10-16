/** JSON com chaves ordenadas, para o hash ser estável independentemente da ordem de inserção. */
export function jsonCanonico(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(jsonCanonico).join(',')}]`
  if (valor && typeof valor === 'object') {
    const obj = valor as Record<string, unknown>
    const chaves = Object.keys(obj).filter((k) => obj[k] !== undefined).sort()
    return `{${chaves.map((k) => `${JSON.stringify(k)}:${jsonCanonico(obj[k])}`).join(',')}}`
  }
  return JSON.stringify(valor)
}

/** SHA-256 (hexadecimal) do texto, via Web Crypto (navegador e Node). */
export async function sha256(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export function hashDoConteudo(conteudo: unknown): Promise<string> {
  return sha256(jsonCanonico(conteudo))
}
