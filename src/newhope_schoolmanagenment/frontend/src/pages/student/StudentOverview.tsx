import { api } from '../../api/client'
import type {
  AssignmentDetail,
  ClassRead,
  ModuleRead,
  StudentRead,
  SubmissionWithAssignment,
  TeacherSummary,
} from '../../api/types'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
  StatCard,
} from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { submissionStatus } from '../../utils/assignment'
import { formatDate, formatDateTime, gradeLabel } from '../../utils/format'

interface Overview {
  student: StudentRead
  schoolClass: ClassRead | null
  modules: ModuleRead[]
  teachers: TeacherSummary[]
  assignments: AssignmentDetail[]
  submissions: SubmissionWithAssignment[]
}

export function StudentOverview({
  navigate,
}: {
  navigate: (path: string) => void
}) {
  const overview = useApi<Overview>(async () => {
    const [
      student,
      schoolClass,
      modules,
      teachers,
      assignments,
      submissions,
    ] = await Promise.all([
      api.get<StudentRead>('/students/me'),
      api.get<ClassRead>('/students/me/class').catch(() => null),
      api.get<ModuleRead[]>('/students/me/modules').catch(() => []),
      api.get<TeacherSummary[]>('/students/me/teachers').catch(() => []),
      api.get<AssignmentDetail[]>('/students/me/assignments').catch(() => []),
      api
        .get<SubmissionWithAssignment[]>('/students/me/submissions')
        .catch(() => []),
    ])
    return { student, schoolClass, modules, teachers, assignments, submissions }
  }, 'student-overview')

  if (overview.loading) {
    return <Spinner label="Loading your portal" />
  }

  if (overview.error || !overview.data) {
    return (
      <Alert>
        {overview.error ?? 'Your portal could not be loaded right now.'}
      </Alert>
    )
  }

  const { student, schoolClass, modules, teachers, assignments, submissions } =
    overview.data

  const submissionByAssignment = new Map(
    submissions.map((item) => [item.assignment_id, item]),
  )
  const recent = assignments.slice(0, 5)
  const graded = submissions.filter(
    (item) => item.grade !== null && item.grade !== undefined,
  )

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Student dashboard"
        title={`Hello, ${student.full_name.split(' ')[0]}`}
        subtitle={
          schoolClass
            ? `${schoolClass.class_name} · ${schoolClass.academic_year}`
            : 'Your class has not been assigned yet.'
        }
        action={
          <Button onClick={() => navigate('/student/assignments')}>
            View assignments
          </Button>
        }
      />

      <div className="stats-grid">
        <StatCard
          label="Modules"
          value={modules.length}
          hint="This academic year"
          tone="info"
        />
        <StatCard
          label="Teachers"
          value={teachers.length}
          hint="Teaching your class"
          tone="success"
        />
        <StatCard
          label="Assignments"
          value={assignments.length}
          hint={`${submissions.length} submitted`}
          tone="gold"
        />
        <StatCard
          label="Graded"
          value={graded.length}
          hint="Feedback available"
          tone="neutral"
        />
      </div>

      <div className="content-grid">
        <Card
          title="Recent assignments"
          subtitle="Work you can submit or revisit"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/student/assignments')}
            >
              See all
            </Button>
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              title="No assignments yet"
              description="When your teachers publish work, it will appear here."
            />
          ) : (
            <ul className="list-stack">
              {recent.map((assignment) => {
                const submission = submissionByAssignment.get(assignment.id)
                const status = submissionStatus(assignment, submission)
                return (
                  <li key={assignment.id} className="list-row">
                    <div className="list-row-main">
                      <strong>{assignment.title}</strong>
                      <span className="muted">
                        {assignment.module.module_name} ·{' '}
                        {assignment.teacher.full_name}
                      </span>
                    </div>
                    <div className="list-row-side">
                      <Badge tone={status.tone}>{status.label}</Badge>
                      <span className="muted small">
                        {formatDate(assignment.deadline)}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <div className="side-stack">
          <Card title="Your class">
            {schoolClass ? (
              <div className="class-card">
                <span className="class-badge">
                  {schoolClass.class_name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <strong>{schoolClass.class_name}</strong>
                  <p className="muted">{schoolClass.academic_year}</p>
                </div>
              </div>
            ) : (
              <p className="muted">
                You are not assigned to a class yet. Please contact the school
                office.
              </p>
            )}
            <div className="info-row">
              <span className="muted">STP number</span>
              <strong>{student.registration_no}</strong>
            </div>
            <div className="info-row">
              <span className="muted">Email</span>
              <strong>{student.email}</strong>
            </div>
          </Card>

          <Card title="Your teachers">
            {teachers.length === 0 ? (
              <p className="muted">No teachers are linked to your class yet.</p>
            ) : (
              <ul className="person-list">
                {teachers.map((teacher) => (
                  <li key={teacher.id}>
                    <span className="avatar avatar-sm">
                      {teacher.full_name.slice(0, 1)}
                    </span>
                    <span>
                      <strong>{teacher.full_name}</strong>
                      <small className="muted">Teacher</small>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {graded.length > 0 ? (
        <Card title="Latest feedback" subtitle="Your most recently graded work">
          <ul className="list-stack">
            {graded.slice(0, 3).map((submission) => (
              <li key={submission.id} className="list-row">
                <div className="list-row-main">
                  <strong>{submission.assignment.title}</strong>
                  <span className="muted">
                    {submission.assignment.module.module_name} ·{' '}
                    {formatDateTime(submission.submitted_at)}
                  </span>
                </div>
                <div className="list-row-side">
                  <Badge tone="success">
                    {gradeLabel(submission.grade)}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  )
}
