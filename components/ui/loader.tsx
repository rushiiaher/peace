import React from 'react'
import styles from './loader.module.css'

export default function Loader() {
    return (
        <div className={styles.loader}>
            <div className={`${styles.cell} ${styles['d-0']}`}></div>
            <div className={`${styles.cell} ${styles['d-1']}`}></div>
            <div className={`${styles.cell} ${styles['d-2']}`}></div>

            <div className={`${styles.cell} ${styles['d-1']}`}></div>
            <div className={`${styles.cell} ${styles['d-2']}`}></div>


            <div className={`${styles.cell} ${styles['d-2']}`}></div>
            <div className={`${styles.cell} ${styles['d-3']}`}></div>


            <div className={`${styles.cell} ${styles['d-3']}`}></div>
            <div className={`${styles.cell} ${styles['d-4']}`}></div>
        </div>
    )
}
