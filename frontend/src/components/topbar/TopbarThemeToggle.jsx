import { HiSun, HiMoon, HiDesktopComputer } from 'react-icons/hi';
import useUIStore from '../../store/uiStore';

/**
 * ThemeToggle — Sun/Moon/Computer icon button in the Topbar.
 * Reads from uiStore.theme and calls toggleTheme on click.
 */
export default function TopbarThemeToggle() {
    const theme = useUIStore(s => s.theme);
    const toggleTheme = useUIStore(s => s.toggleTheme);

    return null; // Temporarily disabled
}
