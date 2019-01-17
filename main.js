const I2CLCDConnection = require('lcdi2c');
const axios = require('axios');
const Gpio = require('onoff').Gpio;

const I2C_ADDR = 0x3f

const lcdConnection = new I2CLCDConnection(1, I2C_ADDR, 16, 2)

const button = new Gpio(21, 'in', 'rising', { debounceTimeout: 100 })

class Screen {
  constructor(lcd, views) {
    this.lcd = lcd

    for (let i in views) {
      if (i > 0) {
        views[i - 1].next = views[i]
      } else {
        views[views.length - 1].next = views[0]
      }

      views[i].model.addUpdateHandler(() => {
        if (this.activeView === views[i]) {
          this.refresh()
        }
      })
    }

    this.views = views
    this.activeView = views[0]
    this.refresh()
  }

  refresh() {
    this.lcd.clear()
    this.lcd.println(this.activeView.heading.toString(), 1)
    this.lcd.println(this.activeView.model.data.toString(), 2)
  }

  nextView() {
    this.activeView = this.activeView.next
    this.refresh()
  }
}

class View {
  constructor(heading, model) {
    this.heading = heading
    this.model = model
  }
}

class Model {
  constructor(initialData = null) {
    this._data = initialData
    this._onUpdateHandlers = []
  }

  addUpdateHandler(fn) {
    this._onUpdateHandlers.push(fn)

    return this
  }

  get data() {
    return this._data
  }

  set data(v) {
    const old = this._data
    this._data = v

    if (this._onUpdateHandlers.length) {
      this._onUpdateHandlers.forEach(handler => {
        handler(old, v)
      })
    }
  }
}

const weatherModel = new Model('Hold on...')

updateWeather()
setInterval(updateWeather, 60000 * 5)

function updateWeather() {
  const host = 'https://api.darksky.net'
  const apiKey = process.env.DARKSKY_KEY
  const latt = process.env.LATT
  const long = process.env.LONG

  axios.get(`${host}/forecast/${apiKey}/${latt},${long}?units=si`)
    .then(response => {
      weatherModel.data = response.data.currently.temperature
    })
    .catch(error => {
      console.error(error)
    })
}

const greetModel = new Model('')

setInterval(() => {
  greetModel.data = '^'.repeat(16)
}, 3000)

const screen = new Screen(lcdConnection, [
  new View('Weather (C)', weatherModel),
  new View('Have a nice day!', greetModel)
])

button.watch(screen.nextView.bind(screen))
