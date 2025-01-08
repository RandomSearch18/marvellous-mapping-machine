export async function initPyScript() {
  const pyscriptImport = await import(
    // @ts-ignore - No types for PyScript :(
    "../node_modules/@pyscript/core/dist/core.js"
  )
  console.debug("PyScript downloaded", pyscriptImport)
}
