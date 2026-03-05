/**
 * App routes: Landing, Login, Dashboard (with feed tabs).
 * Dashboard is open to guests (read-only); feeds hide composer and actions when not logged in.
 */
import { Navigate, useRoutes } from 'react-router-dom'
import { LandingPage } from '../pages/LandingPage'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { SnapsFeed } from '../features/snaps/SnapsFeed'
import { ThreadsFeed } from '../features/threads/ThreadsFeed'
import { WavesFeed } from '../features/waves/WavesFeed'
import { DbuzzFeed } from '../features/dbuzz/DbuzzFeed'
import { MomentFeed } from '../features/moment/MomentFeed'
import { PostCommentsPage } from '../pages/PostCommentsPage'

export function AppRoutes() {
  const routes = useRoutes([
    { path: '/', element: <LandingPage /> },
    { path: '/see-all-snaps', element: <Navigate to="/dashboard/snaps" replace /> },
    {
      path: '/dashboard',
      element: <DashboardLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard/snaps" replace /> },
        { path: 'snaps', element: <SnapsFeed /> },
        { path: 'threads', element: <ThreadsFeed /> },
        { path: 'waves', element: <WavesFeed /> },
        { path: 'dbuzz', element: <DbuzzFeed /> },
        { path: 'moments', element: <MomentFeed /> },
        { path: 'post/:author/:permlink', element: <PostCommentsPage /> },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ])
  return routes
}
