module.exports = {
  apps: [
    {
      name: 'biztrack-backend',
      script: 'uvicorn',
      args: 'src.main:app --host 0.0.0.0 --port 8000',
      cwd: './backend',
      interpreter: './venv/bin/python',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PYTHONUNBUFFERED: '1'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'biztrack-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};

