// Os arquivos de build do pdfmake não trazem tipos; reaproveitamos os de @types/pdfmake.
declare module 'pdfmake/build/pdfmake' {
  import * as pdfMake from 'pdfmake'
  export default pdfMake
}
declare module 'pdfmake/build/vfs_fonts' {
  const vfs: Record<string, string>
  export default vfs
}
