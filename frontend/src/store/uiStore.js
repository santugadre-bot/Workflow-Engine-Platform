import { create } from 'zustand';
import { safeStorage } from '../utils/safeStorage';

// Apply saved theme immediately on module load (before React renders)
// Forced to light mode temporarily
const _savedTheme = 'light';

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', 'light');
}

applyTheme(_savedTheme);

const useUIStore = create((set) => ({
    // Sidebar
    sidebarOpen: true,
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

    // Theme
    theme: 'light',
    toggleTheme: () => set((s) => ({ theme: 'light' })),
    setTheme: (t) => set({ theme: 'light' }),

    // Active organization
    activeOrganizationId: safeStorage.getItem('activeOrganizationId') || null,
    setActiveOrganizationId: (id) => {
        if (id) safeStorage.setItem('activeOrganizationId', id);
        else safeStorage.removeItem('activeOrganizationId');
        set({ activeOrganizationId: id });
    },

    // Modals
    modal: null,
    openModal: (type, props = {}) => set({ modal: { type, ...props } }),
    closeModal: () => set({ modal: null }),

    // Task detail panel
    selectedTaskId: null,
    openTaskDetail: (taskId) => set({ selectedTaskId: taskId }),
    closeTaskDetail: () => set({ selectedTaskId: null }),

    // Toasts
    toasts: [],
    addToast: (message, type = 'info') => {
        const id = Date.now();
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, 4000);
    },

    // Command Palette
    commandPaletteOpen: false,
    openCommandPalette: () => set({ commandPaletteOpen: true }),
    closeCommandPalette: () => set({ commandPaletteOpen: false }),

    // Global Search
    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),

    // Favorites System
    favorites: [],
    loadFavorites: (organizationId) => {
        if (!organizationId) return;
        const stored = safeStorage.getItem(`organization:${organizationId}:favorites`);
        if (stored) {
            set({ favorites: JSON.parse(stored) });
        } else {
            set({ favorites: [] });
        }
    },
    toggleFavorite: (organizationId, item) => {
        set((state) => {
            const exists = state.favorites.some(f => f.path === item.path);
            let newFavorites;
            if (exists) {
                newFavorites = state.favorites.filter(f => f.path !== item.path);
                state.addToast('Removed from favorites', 'info');
            } else {
                newFavorites = [...state.favorites, item];
                state.addToast('Added to favorites', 'success');
            }
            safeStorage.setItem(`organization:${organizationId}:favorites`, JSON.stringify(newFavorites));
            return { favorites: newFavorites };
        });
    },

    // Recents System
    recents: [],
    loadRecents: (organizationId) => {
        if (!organizationId) return;
        const stored = safeStorage.getItem(`organization:${organizationId}:recents`);
        if (stored) {
            set({ recents: JSON.parse(stored) });
        } else {
            set({ recents: [] });
        }
    },
    addRecent: (organizationId, item) => {
        if (!organizationId || !item) return;
        set((state) => {
            const filtered = state.recents.filter(r => r.path !== item.path);
            const newRecents = [item, ...filtered].slice(0, 5);
            safeStorage.setItem(`organization:${organizationId}:recents`, JSON.stringify(newRecents));
            return { recents: newRecents };
        });
    },
}));

export default useUIStore;
