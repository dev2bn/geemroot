export async function adminFetch(path, options = {}) {
  const key = localStorage.getItem('adminKey') || ''
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'x-admin-key': key, ...(options.headers || {}) },
  })
  if (res.status === 401) {
    localStorage.removeItem('adminKey')
    window.location.reload()
    throw new Error('Clé incorrecte')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error((data && data.error) || 'Erreur')
  return data
}