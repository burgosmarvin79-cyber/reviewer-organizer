import { useCallback, useRef, useState } from 'react'
import { useGoogleLogin, type TokenResponse } from '@react-oauth/google'

const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
].join(' ')

function googleErrorMessage(status: number, body: unknown) {
  if (body && typeof body === 'object' && 'error' in body) {
    const error = body.error
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  }
  return `Google API request failed (${status}).`
}

export function useGoogleClassroom() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [error, setError] = useState('')
  const expiresAt = useRef(0)
  const login = useGoogleLogin({
    flow: 'implicit', scope: SCOPES,
    onSuccess(response) { setAccessToken(response.access_token); expiresAt.current = Date.now() + (response.expires_in ?? 3600) * 1000; setError('') },
    onError(response: Pick<TokenResponse, 'error' | 'error_description' | 'error_uri'>) { setError(response.error_description || response.error || 'Google authorization failed.') },
    onNonOAuthError(response) { setError(response.type === 'popup_closed' ? 'The Google sign-in window was closed.' : 'Google could not open the sign-in window.') },
  })
  const disconnect = useCallback(() => { setAccessToken(null); expiresAt.current = 0; setError('') }, [])
  const authenticatedFetch = useCallback(async (url: string) => {
    if (!accessToken) throw new Error('Connect Google Classroom first.')
    if (Date.now() >= expiresAt.current) { disconnect(); throw new Error('Your Google session expired. Connect again.') }
    const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (response.status === 401) { disconnect(); throw new Error('Your Google session expired. Connect again.') }
    return response
  }, [accessToken, disconnect])
  const fetchClassroomApi = useCallback(async <T,>(endpoint: string): Promise<T> => {
    const response = await authenticatedFetch(`https://classroom.googleapis.com/v1/${endpoint}`)
    const body: unknown = await response.json().catch(() => null)
    if (!response.ok) throw new Error(response.status === 403 ? 'Google Classroom access was blocked. Confirm this account is a test user and your school allows the app.' : googleErrorMessage(response.status, body))
    return body as T
  }, [authenticatedFetch])
  const downloadDriveFile = useCallback(async (fileId: string) => {
    const metadataResponse = await authenticatedFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=name,mimeType,size`)
    const metadata: unknown = await metadataResponse.json().catch(() => null)
    if (!metadataResponse.ok) throw new Error(googleErrorMessage(metadataResponse.status, metadata))
    if (!metadata || typeof metadata !== 'object') throw new Error('Google Drive returned invalid file information.')
    const name = 'name' in metadata && typeof metadata.name === 'string' ? metadata.name : 'Classroom file.pdf'
    const mimeType = 'mimeType' in metadata && typeof metadata.mimeType === 'string' ? metadata.mimeType : ''
    const size = 'size' in metadata && typeof metadata.size === 'string' ? Number(metadata.size) : 0
    if (mimeType !== 'application/pdf' && !name.toLowerCase().endsWith('.pdf')) throw new Error(`“${name}” is not a PDF.`)
    if (size > 50 * 1024 * 1024) throw new Error(`“${name}” exceeds the 50 MB limit.`)
    const fileResponse = await authenticatedFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`)
    if (!fileResponse.ok) throw new Error(`Google Drive could not download “${name}”.`)
    return new File([await fileResponse.blob()], name, { type: 'application/pdf' })
  }, [authenticatedFetch])
  return { connected: Boolean(accessToken), error, login, disconnect, fetchClassroomApi, downloadDriveFile }
}
