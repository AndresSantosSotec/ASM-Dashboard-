import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Proxy endpoint: /api/administracion/dashboard/exportar?formato=xlsx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const formato = searchParams.get('formato') || 'xlsx'

    // Backend URL from env (NEXT_PUBLIC_API_URL)
    const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    const backendUrl = `${backendBase.replace(/\/$/, '')}/administracion/dashboard/exportar?formato=${encodeURIComponent(formato)}`

    // Forward Authorization header if present
    const authHeader = req.headers.get('authorization')

    const fetchRes = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })

    if (!fetchRes.ok) {
      const text = await fetchRes.text()
      return NextResponse.json({ error: 'Export failed', details: text }, { status: fetchRes.status })
    }

    const blob = await fetchRes.arrayBuffer()
    const contentType = fetchRes.headers.get('content-type') || 'application/octet-stream'
    const disposition = fetchRes.headers.get('content-disposition') || ''

    const res = new NextResponse(Buffer.from(blob), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition || `attachment; filename="dashboard_export.${formato}"`,
      },
    })

    return res
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
