/**
 * App routes: Landing, Login, Dashboard (with feed tabs), Bookmarks, Search User, Ignored, Settings.
 */
import { Navigate, useRoutes } from 'react-router-dom'
import { LandingPage } from '../pages/LandingPage'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { UnifiedFeedPage } from '../features/feed/UnifiedFeedPage'
import { PostCommentsPage } from '../pages/PostCommentsPage'
import { TagFeedPage } from '../pages/TagFeedPage'
import { BookmarksPage } from '../pages/BookmarksPage'
import { SearchUserPage } from '../pages/SearchUserPage'
import { IgnoredPage } from '../pages/IgnoredPage'
import { SettingsPage } from '../pages/SettingsPage'
import { PrivacyPage } from '../pages/PrivacyPage'
import { UserProfilePage } from '../pages/UserProfilePage'

export function AppRoutes() {
  const routes = useRoutes([
    { path: '/', element: <LandingPage /> },
    { path: '/privacy', element: <PrivacyPage /> },
    { path: '/see-all-snaps', element: <Navigate to="/dashboard" replace /> },
    { path: '/tags/:tag', element: <TagFeedPage /> },
    { path: '/user/:username', element: <UserProfilePage /> },
    {
      path: '/snap/:author/:permlink',
      element: <DashboardLayout />,
      children: [{ index: true, element: <PostCommentsPage /> }],
    },
    {
      path: '/dashboard',
      element: <DashboardLayout />,
      children: [
        { index: true, element: <UnifiedFeedPage /> },
        { path: 'bookmarks', element: <BookmarksPage /> },
        { path: 'search-user', element: <SearchUserPage /> },
        { path: 'ignored', element: <IgnoredPage /> },
        { path: 'settings', element: <SettingsPage /> },
        { path: 'snaps', element: <Navigate to="/dashboard" replace /> },
        { path: 'threads', element: <Navigate to="/dashboard" replace /> },
        { path: 'waves', element: <Navigate to="/dashboard" replace /> },
        { path: 'moments', element: <Navigate to="/dashboard" replace /> },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ])
  return routes
}
