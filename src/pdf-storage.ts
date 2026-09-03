/** Manages private PDF files across the offline cache and Supabase Storage. */
import { db } from './db'
import { supabase } from './lib/supabase'
import type { PdfReviewer } from './types'

const BUCKET = 'reviewer-pdfs'

function storagePath(userId: string, subjectId: string, pdfId: string) {
  // The user ID as the first folder is enforced by Storage security policies.
  return `${userId}/${subjectId}/${pdfId}.pdf`
}

async function authenticatedUserId() {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Please sign in again before managing PDFs.')
  return data.user.id
}

export async function uploadPendingPdf(pdf: PdfReviewer, userId: string) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const localFile = await db.pdfFiles.get(pdf.id)
  if (!localFile) throw new Error(`The local file for “${pdf.name}” is unavailable.`)
  const path = storagePath(userId, pdf.subjectId, pdf.id)
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, localFile.fileData, { contentType: 'application/pdf', upsert: false })
  // An existing object can mean a previous upload succeeded before metadata saved.
  if (uploadError && !uploadError.message.toLowerCase().includes('exist')) throw uploadError
  const { error: metadataError } = await supabase.from('pdf_reviewers').upsert({
    id: pdf.id, user_id: userId, subject_id: pdf.subjectId, name: pdf.name,
    storage_path: path, mime_type: pdf.mimeType, size: pdf.size, created_at: pdf.createdAt,
  })
  if (metadataError) throw metadataError
  await db.pdfs.put({ ...pdf, storagePath: path })
  // Once safely stored in the cloud, remove the duplicate local Blob.
  await db.pdfFiles.delete(pdf.id)
}

export async function migratePendingPdfs(userId: string) {
  // Retry offline uploads individually so one failed PDF does not block the rest.
  const pdfs = await db.pdfs.toArray()
  for (const pdf of pdfs) {
    if (!pdf.storagePath && await db.pdfFiles.get(pdf.id)) {
      try { await uploadPendingPdf(pdf, userId) } catch { /* Keep the local file for the next online retry. */ }
    }
  }
}

export async function createPdfReviewer(subjectId: string, file: File) {
  const userId = await authenticatedUserId()
  const pdf: PdfReviewer = {
    id: crypto.randomUUID(), subjectId, name: file.name, mimeType: 'application/pdf',
    size: file.size, createdAt: new Date().toISOString(),
  }
  await db.transaction('rw', db.pdfs, db.pdfFiles, async () => {
    // Save locally first: a failed upload can be retried without losing the file.
    await db.pdfs.add(pdf)
    await db.pdfFiles.add({ id: pdf.id, fileData: file })
  })
  await uploadPendingPdf(pdf, userId)
}

export async function createPdfOpenUrl(pdf: PdfReviewer) {
  if (!supabase || !pdf.storagePath) throw new Error('This PDF is waiting for private cloud upload. Reconnect and try again shortly.')
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(pdf.storagePath, 300)
  // Signed URLs expire after five minutes and keep the storage bucket private.
  if (error) throw error
  return data.signedUrl
}

export async function deletePdfReviewer(pdf: PdfReviewer) {
  if (supabase && pdf.storagePath) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([pdf.storagePath])
    if (storageError) throw storageError
    const { error: metadataError } = await supabase.from('pdf_reviewers').delete().eq('id', pdf.id)
    if (metadataError) throw metadataError
  }
  await db.transaction('rw', db.pdfs, db.pdfFiles, async () => {
    await db.pdfFiles.delete(pdf.id)
    await db.pdfs.delete(pdf.id)
  })
}

export async function deleteSubjectPdfs(subjectId: string) {
  const pdfs = await db.pdfs.where('subjectId').equals(subjectId).toArray()
  for (const pdf of pdfs) await deletePdfReviewer(pdf)
}

export async function resolvePdfBlob(pdf: PdfReviewer) {
  // Prefer the offline copy; download only when the Blob is no longer cached.
  const localFile = await db.pdfFiles.get(pdf.id)
  if (localFile) return localFile.fileData
  if (!supabase || !pdf.storagePath) throw new Error(`PDF data for “${pdf.name}” is unavailable.`)
  const { data, error } = await supabase.storage.from(BUCKET).download(pdf.storagePath)
  if (error) throw error
  return data
}
