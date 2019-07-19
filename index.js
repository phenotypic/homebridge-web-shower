var Service, Characteristic
const packageJson = require('./package.json')
const request = require('request')
const ip = require('ip')
const http = require('http')

module.exports = function (homebridge) {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-web-shower', 'WebShower', WebShower)
}

function WebShower (log, config) {
  this.log = log

  this.name = config.name
  this.apiroute = config.apiroute
  this.pollInterval = config.pollInterval || 300

  this.listener = config.listener || false
  this.port = config.port || 2000
  this.requestArray = ['state']

  this.heads = config.heads || 2
  this.headArray = []

  this.manufacturer = config.manufacturer || packageJson.author.name
  this.serial = config.serial || this.apiroute
  this.model = config.model || packageJson.name
  this.firmware = config.firmware || packageJson.version

  this.username = config.username || null
  this.password = config.password || null
  this.timeout = config.timeout || 3000
  this.http_method = config.http_method || 'GET'

  if (this.username != null && this.password != null) {
    this.auth = {
      user: this.username,
      pass: this.password
    }
  }

  if (this.listener) {
    this.server = http.createServer(function (request, response) {
      var parts = request.url.split('/')
      var partOne = parts[parts.length - 2]
      var partTwo = parts[parts.length - 1]
      if (parts.length === 3 && this.requestArray.includes(partOne)) {
        this.log('Handling request: %s', request.url)
        response.end('Handling request')
        this._httpHandler(partOne, partTwo)
      } else {
        this.log.warn('Invalid request: %s', request.url)
        response.end('Invalid request')
      }
    }.bind(this))

    this.server.listen(this.port, function () {
      this.log('Listen server: http://%s:%s', ip.address(), this.port)
    }.bind(this))
  }

  this.service = new Service.Faucet(this.name)
}

WebShower.prototype = {

  identify: function (callback) {
    this.log('Identify requested!')
    callback()
  },

  _httpRequest: function (url, body, method, callback) {
    request({
      url: url,
      body: body,
      method: this.http_method,
      timeout: this.timeout,
      rejectUnauthorized: false,
      auth: this.auth
    },
    function (error, response, body) {
      callback(error, response, body)
    })
  },

  _getStatus: function (callback) {
    var url = this.apiroute + '/status'
    this.log.debug('Getting status: %s', url)

    this._httpRequest(url, '', 'GET', function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error getting status: %s', error.message)
        this.service.getCharacteristic(Characteristic.Active).updateValue(new Error('Polling failed'))
        callback(error)
      } else {
        this.log.debug('Device response: %s', responseBody)
        var json = JSON.parse(responseBody)
        this.service.getCharacteristic(Characteristic.Active).updateValue(json.currentState)
        this.service.getCharacteristic(Characteristic.InUse).updateValue(json.currentState)
        this.log('Updated state to: %s', json.currentState)
        callback()
      }
    }.bind(this))
  },

  _httpHandler: function (characteristic, value) {
    switch (characteristic) {
      case 'state':
        this.service.getCharacteristic(Characteristic.InUse).updateValue(value)
        this.service.getCharacteristic(Characteristic.Active).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      default:
        this.log.warn('Unknown characteristic "%s" with value "%s"', characteristic, value)
    }
  },

  setState: function (value, callback) {
    var url = this.apiroute + '/setState/' + value
    // this.log.debug('Setting state: %s', url)
    this.log('Setting state: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting state: %s', error.message)
        callback(error)
      } else {
        this.log('Set state to %s', value)
        callback()
      }
    }.bind(this))
  },

  setTemperature: function (value, callback) {
    var url = this.apiroute + '/setTemperature/' + value
    this.log.debug('Setting state: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting temperature: %s', error.message)
        callback(error)
      } else {
        this.log('Set temperature to %s', value)
        callback()
      }
    }.bind(this))
  },

  setActive: function (head, value, callback) {
    var url = this.apiroute + '/setState/' + value
    this.log.debug('Head %s | Setting state: %s', head, url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Head %s | Error setting state: %s', head, error.message)
        callback(error)
      } else {
        this.log('Head %s | Set state to %s', head, value)
        // this.headArray[head].getCharacteristic(Characteristic.InUse).updateValue(value)
        callback()
      }
    }.bind(this))
  },

  getServices: function () {
    this.informationService = new Service.AccessoryInformation()
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmware)

    this.service.getCharacteristic(Characteristic.TargetHeaterCoolerState).updateValue(0)

    this.service
      .getCharacteristic(Characteristic.HeatingThresholdTemperature)
      .on('set', this.setTemperature.bind(this))

    this.service
      .getCharacteristic(Characteristic.Active)
      .on('set', this.setState.bind(this))

    var services = [this.informationService, this.service]
    for (var head = 1; head <= this.heads; head++) {
      var accessory = new Service.Valve('Head', head)
      accessory
        .setCharacteristic(Characteristic.ServiceLabelIndex, head)
        .setCharacteristic(Characteristic.ValveType, 2)
      accessory.getCharacteristic(Characteristic.Active).updateValue(0)
      accessory.getCharacteristic(Characteristic.InUse).updateValue(0)

      accessory
        .getCharacteristic(Characteristic.Active)
        .on('set', this.setActive.bind(this, head))

      this.headArray[head] = accessory
      this.service.addLinkedService(accessory)
      services.push(accessory)
    }
    this.log('Initialized %s heads', this.heads)

    /*
    this._getStatus(function () {})

    setInterval(function () {
      this._getStatus(function () {})
    }.bind(this), this.pollInterval * 1000)
    */

    return services
  }

}
