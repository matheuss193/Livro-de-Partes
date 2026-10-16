/**
 * Funções modernas que bibliotecas (pdfmake, pdf-lib) usam e que faltam em aparelhos antigos
 * (ex.: iPhone com iOS 14 / Safari 14, Android 8 com Chrome antigo). Só define se não existir.
 */
function definir(alvo: object, nome: string, valor: unknown) {
  if (!(nome in alvo)) Object.defineProperty(alvo, nome, { value: valor, writable: true, configurable: true })
}

function at(this: ArrayLike<unknown> | string, indice: number) {
  const n = Math.trunc(indice) || 0
  const i = n < 0 ? this.length + n : n
  return i < 0 || i >= this.length ? undefined : (this as ArrayLike<unknown>)[i]
}

definir(Array.prototype, 'at', at)
definir(String.prototype, 'at', at)
definir(Object.getPrototypeOf(Uint8Array.prototype), 'at', at)

definir(String.prototype, 'replaceAll', function (this: string, procurar: string | RegExp, trocar: string | ((...a: string[]) => string)) {
  if (procurar instanceof RegExp) {
    if (!procurar.global) throw new TypeError('replaceAll precisa de uma expressão global')
    return this.replace(procurar, trocar as string)
  }
  return this.split(procurar).join(typeof trocar === 'function' ? trocar(procurar) : trocar)
})

definir(Object, 'hasOwn', (o: object, k: PropertyKey) => Object.prototype.hasOwnProperty.call(o, k))
