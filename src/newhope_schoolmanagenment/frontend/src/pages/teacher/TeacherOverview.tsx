import { api } from '../../api/client'
import type {
  AssignmentDetail,
  TeacherDashboard,
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
import { formatDate, isPast } from '../../utils/format'

interface OverviewData {
  dashboard: TeacherDashboard
  assignments: AssignmentDetail[]
}

export function TeacherOverview({
  navigate,
}: {
  navigate: (path: string) => void
}) {
  const overview = useApi<OverviewData>(async () => {
    const [dashboard, assignments] = await Promise.all([
      api.get<TeacherDashboard>('/teacher/dashboard'),
      api.get<AssignmentDetail[]>('/teacher/assignments').catch(() => []),
    ])
    return { dashboard, assignments }
  }, 'teacher-overview')

  if (overview.loading) return <Spinner label="Loading your dashboard" />
  if (overview.error || !overview.data) {
    return <Alert>{overview.error ?? 'Dashboard unavailable'}</Alert>
  }

  const { dashboard, assignments } = overview.data
  const upcoming = assignments
    .filter((item) => !isPast(item.deadline))
    .slice(0, 5)

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Teacher dashboard"
        title="Your teaching overview"
        subtitle="Track your classes, assignments, and the work waiting for feedback."
        action={
          <Button onClick={() => navigate('/teacher/submissions')}>
            Grade submissions
          </Button>
        }
      />

      <div className="stats-grid">
        <StatCard
          label="Assignments"
          value={dashboard.assignments}
          hint="Published to your classes"
          tone="info"
        />
        <StatCard
          label="Submissions"
          value={dashboard.submissions}
          hint="From your students"
          tone="success"
        />
        <StatCard
          label="Awaiting grade"
          value={dashboard.ungraded_submissions}
          hint="Needs your feedback"
          tone="gold"
        />
        <StatCard
          label="Classes"
          value={dashboard.classes}
          hint={`${dashboard.modules} modules`}
          tone="neutral"
        />
      </div>

      <div className="content-grid">
        <Card
          title="Upcoming assignments"
          subtitle="Deadlines still open"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/teacher/assignments')}
            >
              See all
            </Button>
          }
        >
          {upcoming.length === 0 ? (
            <EmptyState
              title="No upcoming deadlines"
              description="Assignments created for you by the DOS will appear here."
            />
          ) : (
            <ul className="list-stack">
              {upcoming.map((assignment) => (
                <li key={assignment.id} className="list-row">
                  <div className="list-row-main">
                    <strong>{assignment.title}</strong>
                    <span className="muted">
                      {assignment.module.module_name} ·{' '}
                      {assignment.school_class.class_name}
                    </span>
                  </div>
                  <div className="list-row-side">
                    <Badge tone={isPast(assignment.deadline) ? 'danger' : 'gold'}>
                      {formatDate(assignment.deadline)}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="side-stack">
          <Card title="Quick actions">
            <div className="action-stack">
              <Button
                variant="secondary"
                block
                onClick={() => navigate('/teacher/submissions')}
              >
                Review submissions
              </Button>
              <Button
                variant="secondary"
                block
                onClick={() => navigate('/teacher/assignments')}
              >
                Browse assignments
              </Button>
              <Button
                variant="ghost"
                block
                onClick={() => navigate('/teacher/profile')}
              >
                View my profile
              </Button>
            </div>
          </Card>

          <Card title="How grading works">
            <p className="muted">
              Open a submission, enter a mark from 0 to 100, and add feedback.
              Students see the update in their portal immediately.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
