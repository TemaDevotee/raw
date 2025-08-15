const base = import.meta.env.VITE_ADMIN_API_BASE
const adminKey = import.meta.env.VITE_ADMIN_KEY

export async function get(path: string, params?: Record<string, any>) {
  const url = new URL(base + path)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v))
    }
  }
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('studio.token') : ''
  const headers: Record<string, string> = { 'X-Admin-Key': adminKey }
  if (token) headers.Authorization = 'Bearer ' + token
  const res = await fetch(url.toString(), { headers })
  if (!res.ok) throw new Error(res.statusText)
  return res.json()
}

export async function post(path: string, body?: any) {
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('studio.token') : ''
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Admin-Key': adminKey
  }
  if (token) headers.Authorization = 'Bearer ' + token
  const res = await fetch(base + path, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  if (!res.ok) throw new Error(res.statusText)
  return res.json()
}

export async function put(path: string, body?: any) {
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('studio.token') : ''
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Admin-Key': adminKey
  }
  if (token) headers.Authorization = 'Bearer ' + token
  const res = await fetch(base + path, {
    method: 'PUT',
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  if (!res.ok) throw new Error(res.statusText)
  return res.json()
}

export async function del(path: string) {
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('studio.token') : ''
  const headers: Record<string, string> = { 'X-Admin-Key': adminKey }
  if (token) headers.Authorization = 'Bearer ' + token
  const res = await fetch(base + path, {
    method: 'DELETE',
    headers
  })
  if (!res.ok) throw new Error(res.statusText)
  return res.status === 204 ? null : res.json()
}

export function upload(path: string, file: File, onProgress?: (n: number) => void) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', base + path)
    xhr.setRequestHeader('X-Admin-Key', adminKey)
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('studio.token') : ''
    if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token)
    if (onProgress) {
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          reject(new Error(String(xhr.status)))
        }
      }
    }
    const fd = new FormData()
    fd.append('file', file)
    xhr.send(fd)
  })
}

export async function download(path: string) {
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('studio.token') : ''
  const headers: Record<string, string> = { 'X-Admin-Key': adminKey }
  if (token) headers.Authorization = 'Bearer ' + token
  const res = await fetch(base + path, { headers })
  if (!res.ok) throw new Error(res.statusText)
  return res.blob()
}
