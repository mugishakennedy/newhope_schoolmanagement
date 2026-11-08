import { useEffect, useState } from 'react'

import { api, errorMessage } from '../api/client'
import type {
  QuestionKind,
  QuizPayload,
  QuizQuestionInput,
  QuizQuestionTeacherRead,
  QuizTeacherRead,
} from '../api/types'
import { Alert, Button, Field, Input, Select, Spinner, Textarea } from './ui'

interface DraftOption {
  text: string
  is_correct: boolean
}

interface DraftQuestion {
  prompt: string
  kind: QuestionKind
  points: string
  correct_answer: string
  options: DraftOption[]
}

function toDraft(question: QuizQuestionTeacherRead): DraftQuestion {
  return {
    prompt: question.prompt,
    kind: question.kind,
    points: String(question.points),
    correct_answer: question.correct_answer ?? '',
    options: question.options.map((option) => ({
      text: option.text,
      is_correct: option.is_correct,
    })),
  }
}

function emptyQuestion(kind: QuestionKind): DraftQuestion {
  return {
    prompt: '',
    kind,
    points: '1',
    correct_answer: '',
    options:
      kind === 'multiple_choice'
        ? [
            { text: '', is_correct: true },
            { text: '', is_correct: false },
          ]
        : [],
  }
}

interface QuizBuilderProps {
  basePath: string
  assignmentId: number
  onSaved?: () => void
  onError?: (message: string) => void
}

export function QuizBuilder({
  basePath,
  assignmentId,
  onSaved,
  onError,
}: QuizBuilderProps) {
  const [questions, setQuestions] = useState<DraftQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    async function run() {
      setLoading(true)
      setError(null)
      try {
        const data = await api.get<QuizTeacherRead>(
          `${basePath}/${assignmentId}/quiz`,
        )
        if (alive) setQuestions(data.questions.map(toDraft))
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
  }, [basePath, assignmentId])

  function report(message: string) {
    setError(message)
    onError?.(message)
  }

  function addQuestion(kind: QuestionKind) {
    setQuestions((current) => [...current, emptyQuestion(kind)])
  }

  function removeQuestion(index: number) {
    setQuestions((current) =>
      current.filter((_, position) => position !== index),
    )
  }

  function updateQuestion(index: number, patch: Partial<DraftQuestion>) {
    setQuestions((current) =>
      current.map((question, position) =>
        position === index ? { ...question, ...patch } : question,
      ),
    )
  }

  function changeKind(index: number, kind: QuestionKind) {
    setQuestions((current) =>
      current.map((question, position) => {
        if (position !== index) return question
        if (kind === 'multiple_choice') {
          const options =
            question.options.length >= 2
              ? question.options
              : [
                  { text: '', is_correct: true },
                  { text: '', is_correct: false },
                ]
          const hasCorrect = options.some((option) => option.is_correct)
          return {
            ...question,
            kind,
            options: hasCorrect
              ? options
              : options.map((option, optionIndex) => ({
                  ...option,
                  is_correct: optionIndex === 0,
                })),
          }
        }
        return { ...question, kind, options: [] }
      }),
    )
  }

  function addOption(index: number) {
    setQuestions((current) =>
      current.map((question, position) =>
        position === index && question.options.length < 6
          ? {
              ...question,
              options: [
                ...question.options,
                { text: '', is_correct: false },
              ],
            }
          : question,
      ),
    )
  }

  function updateOption(
    questionIndex: number,
    optionIndex: number,
    text: string,
  ) {
    setQuestions((current) =>
      current.map((question, position) => {
        if (position !== questionIndex) return question
        return {
          ...question,
          options: question.options.map((option, index) =>
            index === optionIndex ? { ...option, text } : option,
          ),
        }
      }),
    )
  }

  function setCorrectOption(questionIndex: number, optionIndex: number) {
    setQuestions((current) =>
      current.map((question, position) => {
        if (position !== questionIndex) return question
        return {
          ...question,
          options: question.options.map((option, index) => ({
            ...option,
            is_correct: index === optionIndex,
          })),
        }
      }),
    )
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    setQuestions((current) =>
      current.map((question, position) => {
        if (position !== questionIndex) return question
        const options = question.options.filter(
          (_, index) => index !== optionIndex,
        )
        if (options.length > 0 && !options.some((option) => option.is_correct)) {
          options[0] = { ...options[0], is_correct: true }
        }
        return { ...question, options }
      }),
    )
  }

  function buildPayload(): QuizPayload | null {
    if (questions.length === 0) {
      report('Add at least one question to the quiz.')
      return null
    }

    const payload: QuizQuestionInput[] = []
    for (const [index, question] of questions.entries()) {
      const prompt = question.prompt.trim()
      if (!prompt) {
        report(`Question ${index + 1} needs a prompt.`)
        return null
      }
      const points = Number(question.points)
      if (!Number.isFinite(points) || points <= 0) {
        report(`Question ${index + 1} needs points greater than zero.`)
        return null
      }

      if (question.kind === 'multiple_choice') {
        const options = question.options.map((option) => ({
          text: option.text.trim(),
          is_correct: option.is_correct,
        }))
        if (options.length < 2 || options.length > 6) {
          report(`Question ${index + 1} needs 2 to 6 options.`)
          return null
        }
        if (options.some((option) => !option.text)) {
          report(`Question ${index + 1} has an empty option.`)
          return null
        }
        if (options.filter((option) => option.is_correct).length !== 1) {
          report(`Question ${index + 1} needs exactly one correct option.`)
          return null
        }
        payload.push({
          prompt,
          kind: question.kind,
          points,
          correct_answer: null,
          options,
        })
      } else {
        const correctAnswer = question.correct_answer.trim()
        if (!correctAnswer) {
          report(`Question ${index + 1} needs a correct answer.`)
          return null
        }
        payload.push({
          prompt,
          kind: question.kind,
          points,
          correct_answer: correctAnswer,
          options: [],
        })
      }
    }

    return { questions: payload }
  }

  async function save() {
    setNotice(null)
    const payload = buildPayload()
    if (!payload) return
    setSaving(true)
    setError(null)
    try {
      const data = await api.put<QuizTeacherRead>(
        `${basePath}/${assignmentId}/quiz`,
        payload,
      )
      setQuestions(data.questions.map(toDraft))
      setNotice('Quiz saved.')
      onSaved?.()
    } catch (cause) {
      report(errorMessage(cause))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading quiz" />

  return (
    <div className="form-stack">
      {error ? <Alert>{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {questions.length === 0 ? (
        <Alert tone="gold">
          This quiz has no questions yet. Students cannot attempt it until you
          add and save questions.
        </Alert>
      ) : null}

      {questions.map((question, questionIndex) => (
        <div className="read-panel" key={questionIndex}>
          <div className="row-actions" style={{ justifyContent: 'space-between' }}>
            <span className="eyebrow">Question {questionIndex + 1}</span>
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => removeQuestion(questionIndex)}
            >
              Remove
            </Button>
          </div>

          <Field label="Prompt">
            <Textarea
              rows={2}
              value={question.prompt}
              onChange={(event) =>
                updateQuestion(questionIndex, { prompt: event.target.value })
              }
              placeholder="What are you asking?"
            />
          </Field>

          <div className="form-grid">
            <Field label="Type">
              <Select
                value={question.kind}
                onChange={(event) =>
                  changeKind(questionIndex, event.target.value as QuestionKind)
                }
              >
                <option value="multiple_choice">Multiple choice</option>
                <option value="short_answer">Short answer</option>
              </Select>
            </Field>
            <Field label="Points">
              <Input
                type="number"
                min="0.5"
                step="0.5"
                value={question.points}
                onChange={(event) =>
                  updateQuestion(questionIndex, {
                    points: event.target.value,
                  })
                }
              />
            </Field>
          </div>

          {question.kind === 'short_answer' ? (
            <Field
              label="Correct answer"
              hint="Matching ignores case and extra spaces."
            >
              <Input
                value={question.correct_answer}
                onChange={(event) =>
                  updateQuestion(questionIndex, {
                    correct_answer: event.target.value,
                  })
                }
                placeholder="Expected answer"
              />
            </Field>
          ) : (
            <div className="form-stack">
              <span className="field-label">Options</span>
              {question.options.map((option, optionIndex) => (
                <div
                  className="row-actions"
                  key={optionIndex}
                  style={{ alignItems: 'center' }}
                >
                  <input
                    type="radio"
                    name={`correct-${questionIndex}`}
                    checked={option.is_correct}
                    onChange={() =>
                      setCorrectOption(questionIndex, optionIndex)
                    }
                    aria-label={`Mark option ${optionIndex + 1} correct`}
                  />
                  <Input
                    value={option.text}
                    onChange={(event) =>
                      updateOption(
                        questionIndex,
                        optionIndex,
                        event.target.value,
                      )
                    }
                    placeholder={`Option ${optionIndex + 1}`}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeOption(questionIndex, optionIndex)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {question.options.length < 6 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => addOption(questionIndex)}
                >
                  Add option
                </Button>
              ) : null}
            </div>
          )}
        </div>
      ))}

      <div className="row-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={() => addQuestion('multiple_choice')}
        >
          Add multiple choice
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => addQuestion('short_answer')}
        >
          Add short answer
        </Button>
        <Button
          type="button"
          busy={saving}
          disabled={questions.length === 0}
          onClick={() => void save()}
        >
          Save quiz
        </Button>
      </div>
    </div>
  )
}
