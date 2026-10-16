// Publica a demonstração no GitHub Pages (branch gh-pages), sem precisar de GitHub Actions.
// Uso: npm run publicar   (precisa do Git e do repositório com remoto "origin")
import { execSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const sh = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts })
const saida = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim()

const remoto = saida('git remote get-url origin')
const nome = remoto.replace(/\.git$/, '').split('/').pop()

console.log(`Gerando o site para /${nome}/ ...`)
sh('npm test')
sh('npm run build', { env: { ...process.env, VITE_BASE: `/${nome}/`, MSYS_NO_PATHCONV: '1' } })

const pasta = mkdtempSync(join(tmpdir(), 'pages-'))
cpSync('dist', pasta, { recursive: true })
writeFileSync(join(pasta, '.nojekyll'), '')
try {
  sh('git init -q -b gh-pages', { cwd: pasta })
  sh('git add -A', { cwd: pasta })
  sh('git -c user.name="Livro de Partes" -c user.email="noreply@users.noreply.github.com" commit -q -m "Publicação da demonstração"', { cwd: pasta })
  sh(`git push -f ${remoto} gh-pages`, { cwd: pasta })
} finally {
  rmSync(pasta, { recursive: true, force: true })
}
console.log('Pronto. Em alguns minutos: https://<usuario>.github.io/' + nome + '/')
