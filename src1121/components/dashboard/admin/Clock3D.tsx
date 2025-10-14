// src/components/dashboard/admin/Clock3D.tsx
'use client';
import { useState, useEffect } from 'react';
import styles from './Clock3D.module.css';

const Clock3D = () => {
    const [time, setTime] = useState('');

    useEffect(() => {
        console.log("🕒 [Clock3D] Le composant est monté. Démarrage de l'horloge.");
        const checkTime = (i: number): string => {
            return i < 10 ? "0" + i : i.toString();
        };

        const updateTime = () => {
            const today = new Date();
            let h = today.getHours();
            let m = today.getMinutes();
            const newTime = h + ":" + checkTime(m);
            setTime(prevTime => {
                if(prevTime !== newTime) {
                    console.log(`🕒 [Clock3D] Mise à jour de l'heure : ${newTime}`);
                }
                return newTime;
            });
        };

        updateTime(); // Initial call
        const timer = setInterval(updateTime, 500);
        
        return () => {
            console.log("🕒 [Clock3D] Le composant est démonté. Arrêt de l'horloge.");
            clearInterval(timer);
        }
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.rim}></div>
            <div className={styles.outer}></div>
            <div className={styles.inner}></div>
            <div id={styles.clock}>{time}</div>
        </div>
    );
};

export default Clock3D;
