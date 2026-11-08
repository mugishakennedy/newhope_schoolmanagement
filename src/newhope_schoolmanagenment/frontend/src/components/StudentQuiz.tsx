import { useEffect, useState } from 'react'

import { ApiError, api, errorMessage } from '../api/client'
import type {
  AssignmentAttachment,
  AssignmentDetail,
  QuizAttemptRead,
  QuizQuestionRead,
  QuizRead,
} from '../api/types'
import { formatDateTime, isPast } from '../utils/format'
import { Alert, Badge, Button, Input, Spinner } from './ui'
import { FilePreview } from './FilePreview'

interface SelectedAnswer {
  optionId?: number
  text?: string
}

interface StudentQuizProps {
  assignment: AssignmentDetail
  onSubmitted?: () => void
}

export function StudentQuiz({ assignment, onSubmitted }: StudentQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestionRead[]>([])
  const [attempt, setAttempt] = useState<QuizAttemptRead | null>(null)
  const [attachments, setAttachments] = useState<AssignmentAttachment[]>([])
  const [selected, setSelected] = useState<Record<number, SelectedAnswer>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const closed = isPast(assignment.deadline)

  useEffect(() => {
    let alive = true

    async function run() {
      setLoading(true)
      setError(null)
      try {
        const [quiz, existing, files] = await Promise.all([
          api.get<QuizRead>(
            `/students/me/assignments/${assignment.id}/quiz`,
          ),
          api
            .get<QuizAttemptRead>(
              `/students/me/assignments/${assignment.id}/quiz/attempt`,
            )
            .catch((cause) => {
              if (cause instanceof ApiError && cause.status === 404) {
                return null
              }
              throw cause
            }),
          api
            .get<AssignmentAttachment[]>(
              `/students/me/assignments/${assignment.id}/attachments`,
            )
            .catch(() => []),
        ])
        if (!alive) return
        setQuestions(quiz.questions)
        setAttempt(existing)
        setAttachments(files)
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
  }, [assignment.id])

  function setOption(questionId: number, optionId: number) {
    setSelected((current) => ({
      ...current,
      [questionId]: { ...current[questionId], optionId },
    }))
  }

  function setText(questionId: number, text: string) {
    setSelected((current) => ({
      ...current,
      [questionId]: { ...current[questionId], text },
    }))
  }

  async function submit() {
    const answers = questions.map((question) => {
      const answer = selected[question.id] ?? {}
      return {
        question_id: question.id,
        selected_option_id:
          question.kind === 'multiple_choice'
            ? (answer.optionId ?? null)
            : null,
        answer_text:
          question.kind === 'short_answer'
            ? answer.text?.trim() || null
            : null,
      }
    })
    const unanswered = answers.some(
      (answer) =>
        answer.selected_option_id === null && answer.answer_text === null,
    )
    if (
      unanswered &&
      !window.confirm(
        'Some questions are unanswered. Submit the quiz anyway?',
      )
    ) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await api.post<QuizAttemptRead>(
        `/students/me/assignments/${assignment.id}/quiz/attempts`,
        { answers },
      )
      setAttempt(result)
      onSubmitted?.()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Spinner label="Loading quiz" />

  if (attempt) {
    const questionById = new Map(
      questions.map((question) => [question.id, question]),
    )
    return (
      <div className="form-stack">
        {error ? <Alert>{error}</Alert> : null}
        <div className="read-panel">
          <span className="eyebrow">Your result</span>
          <p>
            <strong>{Number(attempt.score)}</strong> /{' '}
            {Number(attempt.max_score)} points
          </p>
          <p className="muted">
            Submitted {formatDateTime(attempt.submitted_at)}
          </p>
          {closed ? null : (
            <p className="muted">
              You can retake this quiz until the deadline. The latest attempt
              replaces the previous one.
            </p>
          )}
        </div>
        {attempt.answers.map((answer) => {
          const question = questionById.get(answer.question_id)
          const chosen =
            question?.options.find(
              (option) => option.id === answer.selected_option_id,
            )?.text ??
            answer.answer_text ??
            'No answer'
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
              <p className="muted">Your answer: {chosen}</p>
              <small className="muted">
                {Number(answer.points_awarded)} /{' '}
                {Number(question?.points ?? 0)} points
              </small>
            </div>
          )
        })}
        {closed ? null : (
          <div className="row-actions">
            <Button onClick={() => setAttempt(null)}>Retake quiz</Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="form-stack">
      {error ? <Alert>{error}</Alert> : null}
      {closed ? (
        <Alert tone="gold">The deadline for this quiz has passed.</Alert>
      ) : null}
      {attachments.length > 0 ? (
        <div className="read-panel">
          <span className="eyebrow">Resources</span>
          <div className="attachment-list">
            {attachments.map((attachment) => (
              <FilePreview
                key={attachment.id}
                url={attachment.content_url}
                name={attachment.original_name}
                contentType={attachment.content_type}
              />
            ))}
          </div>
        </div>
      ) : null}
      {questions.length === 0 ? (
        <Alert tone="gold">
          This quiz has no questions yet. Check back soon.
        </Alert>
      ) : null}
      {questions.map((question, index) => (
        <div className="read-panel" key={question.id}>
          <div
            className="row-actions"
            style={{ justifyContent: 'space-between' }}
          >
            <span className="eyebrow">Question {index + 1}</span>
            <small className="muted">
              {Number(question.points)} point
              {Number(question.points) === 1 ? '' : 's'}
            </small>
          </div>
          <p>{question.prompt}</p>
          {question.kind === 'multiple_choice' ? (
            <div className="form-stack">
              {question.options.map((option) => (
                <label
                  key={option.id}
                  style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={selected[question.id]?.optionId === option.id}
                    disabled={closed}
                    onChange={() => setOption(question.id, option.id)}
                  />
                  <span>{option.text}</span>
                </label>
              ))}
            </div>
          ) : (
            <Input
              value={selected[question.id]?.text ?? ''}
              disabled={closed}
              onChange={(event) => setText(question.id, event.target.value)}
              placeholder="Your answer"
            />
          )}
        </div>
      ))}
      <div className="row-actions">
        <Button
          onClick={() => void submit()}
          busy={busy}
          disabled={closed || questions.length === 0}
        >
          Submit quiz
        </Button>
      </div>
    </div>
  )
}
