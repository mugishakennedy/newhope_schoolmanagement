import type { AssignmentSummary, SubmissionRead } from '../api/types'
import type { Tone } from '../components/ui'
import { isPast } from './format'

export function submissionStatus(
  assignment: AssignmentSummary,
  submission?: SubmissionRead,
): { label: string; tone: Tone } {
  if (submission) {
    if (submission.grade !== null && submission.grade !== undefined) {
      return { label: 'Graded', tone: 'success' }
    }
    return { label: 'Submitted', tone: 'info' }
  }
  if (isPast(assignment.deadline)) {
    return { label: 'Overdue', tone: 'danger' }
  }
  return { label: 'Open', tone: 'gold' }
}
