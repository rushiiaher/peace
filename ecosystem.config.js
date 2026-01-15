module.exports = {
    apps: [
        {
            name: 'lms-platform',
            script: 'node_modules/next/dist/bin/next',
            args: 'start',
            interpreter: 'node',
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            },
            instances: 'max',
            exec_mode: 'cluster',
            max_memory_restart: '1500M' // Restart if memory usage > 1.5GB to prevent CPU choking on GC
        },
    ],
}
