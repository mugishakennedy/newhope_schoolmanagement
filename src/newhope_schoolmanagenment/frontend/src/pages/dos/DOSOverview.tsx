import { api } from '../../api/client'
import type { DOSDashboard } from '../../api/types'
import {
  Alert,
  Button,
  Card,
  PageHeader,
  Spinner,
  StatCard,
} from '../../components/ui'
import { useApi } from '../../hooks/useApi'

export function DOSOverview({
  navigate,
}: {
  navigate: (path: string) => void
}) {
  const dashboard = useApi<DOSDashboard>(
    () => api.get('/dos/dashboard'),
    'dos-dashboard',
  )

  if (dashboard.loading) return <Spinner label="Loading the dashboard" />
  if (dashboard.error || !dashboard.data) {
    return <Alert>{dashboard.error ?? 'Dashboard unavailable'}</Alert>
  }

  const stats = dashboard.data

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Dean of Studies"
        title="School overview"
        subtitle="The people, classes, and work moving through Newhope right now."
        action={
          <Button onClick={() => navigate('/dos/assignments')}>
            Create assignment
          </Button>
        }
      />

      {stats.ungraded_submissions > 0 ? (
        <Alert tone="gold">
          {stats.ungraded_submissions} submission
          {stats.ungraded_submissions === 1 ? '' : 's'} still need a grade.
        </Alert>
      ) : null}

      <div className="stats-grid stats-grid-7">
        <StatCard
          label="Students"
          value={stats.students}
          hint="Registered"
          tone="info"
        />
        <StatCard
          label="Teachers"
          value={stats.teachers}
          hint="On staff"
          tone="success"
        />
        <StatCard
          label="Classes"
          value={stats.classes}
          hint="Academic year"
          tone="neutral"
        />
        <StatCard
          label="Modules"
          value={stats.modules}
          hint="Being taught"
          tone="gold"
        />
        <StatCard
          label="Assignments"
          value={stats.assignments}
          hint="Published"
          tone="info"
        />
        <StatCard
          label="Submissions"
          value={stats.submissions}
          hint="Received"
          tone="success"
        />
        <StatCard
          label="Ungraded"
          value={stats.ungraded_submissions}
          hint="Needs attention"
          tone="danger"
        />
      </div>

      <div className="content-grid">
        <Card title="Daily work" subtitle="The short paths through the office">
          <div className="quick-grid">
            <button
              type="button"
              className="quick-card"
              onClick={() => navigate('/dos/teachers')}
            >
              <strong>Add a teacher</strong>
              <span>Create credentials and assign modules.</span>
            </button>
            <button
              type="button"
              className="quick-card"
              onClick={() => navigate('/dos/classes')}
            >
              <strong>Set up classes</strong>
              <span>Keep each academic year organised.</span>
            </button>
            <button
              type="button"
              className="quick-card"
              onClick={() => navigate('/dos/modules')}
            >
              <strong>Manage modules</strong>
              <span>Add the subjects teachers will deliver.</span>
            </button>
            <button
              type="button"
              className="quick-card"
              onClick={() => navigate('/dos/submissions')}
            >
              <strong>Review submissions</strong>
              <span>Grade work and leave feedback.</span>
            </button>
          </div>
        </Card>

        <Card title="How the office works">
          <ol className="step-list">
            <li>
              <span>1</span>
              Create classes for the academic year.
            </li>
            <li>
              <span>2</span>
              Add modules and teacher accounts.
            </li>
            <li>
              <span>3</span>
              Assign teachers to modules and classes.
            </li>
            <li>
              <span>4</span>
              Publish assignments. Teachers grade; students follow feedback.
            </li>
          </ol>
        </Card>
      </div>
    </div>
  )
}
