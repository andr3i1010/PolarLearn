import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';

// Define your state types
type AppState = {
    theme: 'light' | 'dark';
    user: { id: string; name: string } | null;
    // Other state properties
};

// Define action types
type Action =
    | { type: 'SET_THEME'; theme: 'light' | 'dark' }
    | { type: 'SET_USER'; user: { id: string; name: string } | null }
// Other action types

// Initial state
const initialState: AppState = {
    theme: 'dark',
    user: null,
    // Initialize other properties
};

// Create context with a default value
const AppStateContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
}>({
    state: initialState,
    dispatch: () => null,
});

// Reducer function
function appReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_THEME':
            return { ...state, theme: action.theme };
        case 'SET_USER':
            return { ...state, user: action.user };
        default:
            return state;
    }
}

// Provider component with memoization
export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({ state, dispatch }), [state]);

    return (
        <AppStateContext.Provider value={contextValue}>
            {children}
        </AppStateContext.Provider>
    );
};

// Custom hooks for accessing specific parts of state
export const useAppState = () => useContext(AppStateContext);

export const useTheme = () => {
    const { state, dispatch } = useAppState();

    const setTheme = useCallback((theme: 'light' | 'dark') => {
        dispatch({ type: 'SET_THEME', theme });
    }, [dispatch]);

    return { theme: state.theme, setTheme };
};

export const useUser = () => {
    const { state, dispatch } = useAppState();

    const setUser = useCallback((user: { id: string; name: string } | null) => {
        dispatch({ type: 'SET_USER', user });
    }, [dispatch]);

    return { user: state.user, setUser };
};
