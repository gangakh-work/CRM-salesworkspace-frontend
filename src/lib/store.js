import { createContext, useContext } from 'react'

/** Everything a page needs from the shell: navigation, settings and toasts. */
export const AppContext = createContext(null)

export const useApp = () => useContext(AppContext)
