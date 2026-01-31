module.exports = {
  apps: [{
    name: 'hotel-search-api',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    
    // Auto-restart settings
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Monitoring
    monitoring: false,
    
    // Advanced settings
    kill_timeout: 5000,
    listen_timeout: 8000,
    
    // Environment variables
    env_file: '.env'
  }],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/hotel-search-platform.git',
      path: '/var/www/hotel-search',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};