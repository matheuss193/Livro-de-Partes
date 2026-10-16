import { useCallback, useEffect, useRef, useState } from 'react'
import { TIPOS_ANEXO, type AnexoMeta } from '../../data/repositorio'
import type { ItemQuantificado } from '../../domain/tipos'
import { Rotulo } from '../../ui/campos'
import { useApp } from '../../ui/contexto'

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

/** Abre o arquivo guardado numa nova aba (visualização). */
export async function abrirAnexo(obter: () => Promise<{ blob: Blob } | undefined>) {
  const a = await obter()
  if (!a) return
  const url = URL.createObjectURL(a.blob)
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** Anexar PDF ou foto aos documentos da Juntada (item VIII). Só enquanto a Parte é rascunho. */
export default function AnexosJuntada({ parteId, juntada }: { parteId: string; juntada: ItemQuantificado[] }) {
  const { repo } = useApp()
  const [anexos, setAnexos] = useState<AnexoMeta[]>([])
  const [rotulo, setRotulo] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const arquivoRef = useRef<HTMLInputElement>(null)
  const fotoRef = useRef<HTMLInputElement>(null)

  const carregar = useCallback(() => { repo.listarAnexos(parteId).then(setAnexos) }, [repo, parteId])
  useEffect(carregar, [carregar])

  async function receber(arquivos: FileList | null) {
    if (!arquivos?.length) return
    setErro(''); setOcupado(true)
    try {
      for (const f of Array.from(arquivos)) await repo.adicionarAnexo(parteId, f, rotulo)
      carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível anexar.')
    }
    setOcupado(false)
    if (arquivoRef.current) arquivoRef.current.value = ''
    if (fotoRef.current) fotoRef.current.value = ''
  }

  return (
    <div className="cartao" style={{ marginTop: 12 }}>
      <h3>Anexar documentos</h3>
      <p className="suave">PDF ou foto (até 10 MB cada): mapa de ronda, controle de viaturas, controle de civis e militares, permutas, notas fiscais ou qualquer outro. Os anexos saem no PDF completo da Parte e entram no código de verificação.</p>
      <Rotulo texto="Referente a">
        <select value={rotulo} onChange={(e) => setRotulo(e.target.value)}>
          <option value="">— outro documento —</option>
          {juntada.filter((j) => j.descricao.trim()).map((j, i) => <option key={i} value={j.descricao}>{j.descricao}</option>)}
        </select>
      </Rotulo>
      <div className="linha" style={{ marginTop: 8 }}>
        <button type="button" className="primario" disabled={ocupado} onClick={() => arquivoRef.current?.click()}>Escolher PDF / foto</button>
        <button type="button" disabled={ocupado} onClick={() => fotoRef.current?.click()}>Fotografar</button>
      </div>
      <input ref={arquivoRef} type="file" hidden multiple accept={TIPOS_ANEXO.join(',')} onChange={(e) => receber(e.target.files)} />
      <input ref={fotoRef} type="file" hidden accept="image/*" capture="environment" onChange={(e) => receber(e.target.files)} />
      {erro && <div className="aviso bloqueia">{erro}</div>}
      {anexos.map((a) => (
        <div className="item-lista" key={a.id}>
          <strong>{a.nome}</strong>
          <div className="suave">{a.rotulo ?? 'Outro documento'} · {kb(a.tamanho)} · {a.sha256.slice(0, 8)}</div>
          <div className="linha" style={{ marginTop: 6 }}>
            <button type="button" className="pequeno" onClick={() => abrirAnexo(() => repo.obterAnexo(a.id))}>Abrir</button>
            <button type="button" className="perigo pequeno" onClick={async () => { await repo.removerAnexo(a.id); carregar() }}>Remover</button>
          </div>
        </div>
      ))}
    </div>
  )
}
