<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"></a>
</p>

<span align="center">

# homebridge-web-shower _(Under Development)_

[![npm](https://img.shields.io/npm/v/homebridge-web-shower.svg)](https://www.npmjs.com/package/homebridge-web-shower) [![npm](https://img.shields.io/npm/dt/homebridge-web-shower.svg)](https://www.npmjs.com/package/homebridge-web-shower)

</span>

## Description

This [homebridge](https://github.com/nfarina/homebridge) plugin exposes a web-based shower to Apple's [HomeKit](http://www.apple.com/ios/home/). Using simple HTTP requests, the plugin allows you to turn on/off specific shower heads aand control the temperature.

## Installation

1. Install [homebridge](https://github.com/nfarina/homebridge#installation-details)
2. Install this plugin: `npm install -g homebridge-web-shower`
3. Update your `config.json` file

## Configuration

```json
"accessories": [
     {
       "accessory": "WebShower",
       "name": "Shower",
       "apiroute": "http://myurl.com"
     }
]
```

### Core
| Key | Description | Default |
| --- | --- | --- |
| `accessory` | Must be `WebSprinklers` | N/A |
| `name` | Name to appear in the Home app | N/A |
| `apiroute` | Root URL of your device | N/A |
| `town` | Your nearest town | N/A |
| `country` | Your country code | N/A |
| `key` | Your [Apixu API](https://www.apixu.com) key  | N/A |
| `zones` | Number of sprinkler zones  | `3` |

## Optional fields
| Key | Description | Default |
| --- | --- | --- |
| `scheduling` | Whether or not to enable scheduling (`yes`/`no`)  | `yes` |

### Additional options
| Key | Description | Default |
| --- | --- | --- |
| `pollInterval` | Time (in seconds) between device polls | `300` |
| `listener` | Whether to start a listener to get real-time changes from the device | `false` |
| `timeout` | Time (in milliseconds) until the accessory will be marked as _Not Responding_ if it is unreachable | `3000` |
| `port` | Port for your HTTP listener (if enabled) | `2000` |
| `http_method` | HTTP method used to communicate with the device | `GET` |
| `username` | Username if HTTP authentication is enabled | N/A |
| `password` | Password if HTTP authentication is enabled | N/A |
| `model` | Appears under the _Model_ field for the accessory | plugin |
| `serial` | Appears under the _Serial_ field for the accessory | apiroute |
| `manufacturer` | Appears under the _Manufacturer_ field for the accessory | author |
| `firmware` | Appears under the _Firmware_ field for the accessory | version |

## API Interfacing

Your API should be able to:

1. Return JSON information when it receives `/status`:
```
[
  {
    "zone": 1,
    "state": 0
  },
  {
    "zone": 2,
    "state": 0
  },
  {
    "zone": 3,
    "state": 0
  },
  ...
]
```

2. Set zone state when it receives:
```
/state?value=INT_VALUE?zone=INT_VALUE
```

### Optional (if listener is enabled)

1. Update `state` following a manual zone override by messaging the listen server:
```
/state?value=INT_VALUE?zone=INT_VALUE
```
