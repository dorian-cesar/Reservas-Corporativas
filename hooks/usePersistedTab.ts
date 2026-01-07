import { useState, useEffect } from 'react'

export function usePersistedTab(defaultTab: string, storageKey: string) {
    const [activeTab, setActiveTab] = useState(defaultTab)

    // Cargar tab guardado al montar el componente
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedTab = localStorage.getItem(storageKey)
            if (savedTab) {
                setActiveTab(savedTab)
            }
        }
    }, [storageKey])

    // Función para cambiar tab y guardar en localStorage
    const handleTabChange = (value: string) => {
        setActiveTab(value)
        if (typeof window !== "undefined") {
            localStorage.setItem(storageKey, value)
        }
    }

    return {
        activeTab,
        handleTabChange,
        setActiveTab // Opcional: si necesitas cambiar sin guardar
    }
}