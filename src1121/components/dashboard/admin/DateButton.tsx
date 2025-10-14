// src/components/dashboard/admin/DateButton.tsx
'use client';

import React from 'react';
import styles from './DateButton.module.css';

interface DateButtonProps {
    dateString: string;
}

const DateButton: React.FC<DateButtonProps> = ({ dateString }) => {
    return (
        <div className={styles.buttonWrap}>
            <button className={styles.button}>
                <span className={styles.text}>{dateString}</span>
            </button>
            <div className={styles.buttonShadow}></div>
        </div>
    );
};

export default DateButton;
