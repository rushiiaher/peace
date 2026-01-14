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
            exec_mode: 'cluster'
        },
    ],
}
