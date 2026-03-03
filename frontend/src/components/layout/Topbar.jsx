import TopbarBreadcrumb from '../topbar/TopbarBreadcrumb';
import TopbarSearch from '../topbar/TopbarSearch';
import TopbarQuickCreate from '../topbar/TopbarQuickCreate';
import TopbarHelpMenu from '../topbar/TopbarHelpMenu';
import TopbarThemeToggle from '../topbar/TopbarThemeToggle';
import NotificationDropdown from './NotificationDropdown';
import UserMenu from './UserMenu';

/**
 * Topbar — enterprise application header.
 *
 * Uses CSS vars (--topbar-bg, --topbar-border, --topbar-divider) so it adapts
 * automatically to both light and dark themes.
 *
 * Layout:
 *   LEFT:   [BreadcrumbTrail]
 *   CENTER: [GlobalSearch]
 *   RIGHT:  [QuickCreate] [Notifications] [Help] [ThemeToggle] [UserMenu]
 *
 * Height: h-14
 */
export default function Topbar() {
    return (
        <header
            className="h-14 px-4 flex items-center justify-between sticky top-0 z-[1000] backdrop-blur-xl bg-[var(--topbar-bg)] border-b border-[var(--topbar-border)]"
        >
            {/* LEFT — Breadcrumb */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <TopbarBreadcrumb />
            </div>

            {/* CENTER — Search */}
            <div className="flex-shrink-0 w-64 xl:w-80 px-4">
                <TopbarSearch />
            </div>

            {/* RIGHT — Action cluster */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <TopbarQuickCreate />
                <div className="w-px h-5 mx-1 bg-[var(--topbar-divider)]" />
                <NotificationDropdown />
                <TopbarHelpMenu />
                <TopbarThemeToggle />
                <div className="w-px h-5 mx-1 bg-[var(--topbar-divider)]" />
                <UserMenu />
            </div>
        </header>
    );
}
