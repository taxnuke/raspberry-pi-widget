module.exports = {
  apps: [
    {
      name: 'rpi-widget',
      script: 'main.js'
    }
  ],

  deploy: {
    raspberry: {
      user: 'pi',
      host: '10.0.1.26',
      ref: 'origin/master',
      repo: 'git@github.com:taxnuke/raspberry-pi-widget.git',
      path: '/home/pi/rpi-widget',
      'post-deploy': 'npm i && pm2 reload ecosystem.config.js'
    }
  }
}
