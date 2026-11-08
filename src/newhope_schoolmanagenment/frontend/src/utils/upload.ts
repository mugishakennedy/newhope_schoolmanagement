import { api } from '../api/client'

export async function uploadAssignmentFiles(
  basePath: string,
  assignmentId: number,
  files: File[],
): Promise<void> {
  for (const file of files) {
    const body = new FormData()
    body.append('file', file)
    await api.upload(`${basePath}/${assignmentId}/attachments`, body)
  }
}
