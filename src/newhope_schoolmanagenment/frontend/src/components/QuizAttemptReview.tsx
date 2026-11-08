import { useEffect, useState } from 'react'

import { api, errorMessage } from '../api/client'
import type { QuizAttemptRead, QuizTeacherRead } from '../api/types'
import { Alert, Badge, Spinner } from './ui'

interface QuizAttemptReviewProps {
  basePath: string
  assignmentId: number
  submissionId: number
}

export function QuizAttemptReview({
  basePath,
  assignmentId,
  submissionId,
}: QuizAttemptReviewProps) {
  const [quiz, setQuiz] = useState<QuizTeacherRead | null>(null)
  const [attempt, setAttempt] = useState<QuizAttemptRead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    async function run() {
      setLoading(true)
      setError(null)
      try {
        const [quizData, attemptData] = await Promise.all([
          api.get<QuizTeacherRead>(
            `${basePath}/assignments/${assignmentId}/quiz`,
          ),
          api.get<QuizAttemptRead>(
            `${basePath}/submissions/${submissionId}/quiz`,
          ),
        ])
        if (!alive) return
        setQuiz(quizData)
        setAttempt(attemptData)
      } catch (cause) {
        if (alive) setError(errorMessage(cause))
      } finally {
        if (alive) setLoading(false)
      }
    }

    void run()

    return () => {
      alive = false
    }
  }, [basePath, assignmentId, submissionId])

  if (loading) return <Spinner label="Loading quiz answers" />
  if (error) return <Alert>{error}</Alert>
  if (!quiz || !attempt) return null

  const questionById = new Map(
    quiz.questions.map((question) => [question.id, question]),
  )

  return (
    <div className="form-stack">
      <div className="read-panel">
        <span className="eyebrow">Quiz score</span>
        <p>
          <strong>{Number(attempt.score)}</strong> /{' '}
          {Number(attempt.max_score)} points
        </p>
      </div>
      {attempt.answers.map((answer) => {
        const question = questionById.get(answer.question_id)
        const chosen =
          question?.options.find(
            (option) => option.id === answer.selected_option_id,
          )?.text ??
          answer.answer_text ??
          'No answer'
        const correctOption = question?.options.find(
          (option) => option.is_correct,
        )?.text
        return (
          <div className="read-panel" key={answer.id}>
            <div
              className="row-actions"
              style={{ justifyContent: 'space-between' }}
            >
              <strong>
                {question?.prompt ?? `Question ${answer.question_id}`}
              </strong>
              <Badge tone={answer.is_correct ? 'success' : 'danger'}>
                {answer.is_correct ? 'Correct' : 'Incorrect'}
              </Badge>
            </div>
            <p className="muted">Answered: {chosen}</p>
            {question?.kind === 'short_answer' && question.correct_answer ? (
              <small className="muted">
                Expected: {question.correct_answer}
              </small>
            ) : null}
            {question?.kind === 'multiple_choice' && correctOption ? (
              <small className="muted">
                Correct option: {correctOption}
              </small>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
