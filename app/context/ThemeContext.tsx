"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("dark");

    // On mount, check if there's a saved theme
    useEffect(() => {
        const savedTheme = localStorage.getItem("empi-theme") as Theme | null;
        if (savedTheme) {
            setThemeState(savedTheme);
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            setThemeState("dark");
        }
    }, []);

    // Update localStorage and document class when theme changes
    useEffect(() => {
        localStorage.setItem("empi-theme", theme);
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const toggleTheme = () => {
        setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
