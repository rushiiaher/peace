"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Tab {
    id: string
    label: string
    count?: number
}

interface AnimatedTabsProps {
    tabs: Tab[]
    activeTab: string
    onChange: (id: string) => void
    className?: string
}

export function AnimatedTabs({
    tabs,
    activeTab,
    onChange,
    className
}: AnimatedTabsProps) {
    return (
        <div className={cn("flex space-x-1", className)}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            "relative rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-2",
                            "text-muted-foreground hover:text-foreground",
                            isActive && "text-foreground"
                        )}
                        style={{
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="bubble"
                                className="absolute inset-0 z-10 bg-white dark:bg-gray-800 shadow-sm rounded-full mix-blend-difference"
                                style={{ borderRadius: 9999 }}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-20">{tab.label}</span>
                    </button>
                )
            })}
        </div>
    )
}

// Improved version with cleaner layer logic and centralized aesthetics
export function AnimatedTabsProfessional({
    tabs,
    activeTab,
    onChange,
    className
}: AnimatedTabsProps) {
    return (
        <div className={cn(
            "flex items-center justify-center w-fit p-1.5 bg-secondary/30 backdrop-blur-sm rounded-full border border-border/40 select-none",
            className
        )}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        "relative px-6 py-2.5 text-sm font-medium transition-colors duration-200 z-10 rounded-full",
                        activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                    )}
                >
                    {activeTab === tab.id && (
                        <motion.div
                            layoutId="active-pill"
                            className="absolute inset-0 bg-background shadow-md rounded-full border border-border/50"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            style={{ zIndex: -1 }}
                        />
                    )}
                    <span className="relative z-10 flex items-center gap-2.5">
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[11px] font-bold leading-none transition-colors",
                                activeTab === tab.id
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground group-hover:bg-background/80"
                            )}>
                                {tab.count}
                            </span>
                        )}
                    </span>
                </button>
            ))}
        </div>
    )
}
