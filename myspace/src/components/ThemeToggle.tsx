import React, { useState } from 'react';

const ThemeToggle = () => {
    const [isClassic, setIsClassic] = useState(true);

    const toggleTheme = () => {
        setIsClassic(!isClassic);
        document.documentElement.classList.toggle('classic-theme', isClassic);
        document.documentElement.classList.toggle('modern-theme', !isClassic);
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 bg-blue-500 text-white rounded"
        >
            Switch to {isClassic ? 'Modern' : 'Classic'} Theme
        </button>
    );
};

export default ThemeToggle;