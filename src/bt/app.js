const exampleUuid =     '98dcea57-f687-4f75-c1f8-290ebf29da57'
const puckUartUuid = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const puckUartTxUuid = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const puckUartRxUuid = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

const advertisingUuid = 'd0760001-e114-760a-9029-ed687d138355';
const batteryLevelUuid = 'd0760002-e114-760a-9029-ed687d138355';

function page(pos, offset) { return (pos * 4) + (offset || 0); }

const uuidPrefix = 'd076';
const uuidSuffix = '-e114-760a-9029-ed687d138355';
const uuidCounter = 10;

function uuid() {
    const id = uuidCounter.toString();
    return uuidPrefix + '0'.repeat(4 - id.length) + id + uuidSuffix;
}

const WRITE_PROTECTION = {
    CONSTANT: 'constant',
    LOCKABLE: 'lockable',
    READ_ONLY: 'read-only',
    DYNAMIC: 'dynamic',
};

const dynamicData = {
    pwd: {
        start: page(0x85),
        length: 4,
        protection: WRITE_PROTECTION.LOCKABLE,
        uuid: uuid(),
    },
    pack: {
        start: page(0x86),
        length: 2,
        protection: WRITE_PROTECTION.LOCKABLE,
        uuid: uuid(),
    },
    serial: {
        start: page(0x00),
        length: 9,
        protection: WRITE_PROTECTION.CONSTANT,
        uuid: uuid(),
    },
    lock_bytes: {
        start: page(0x02, 2),
        length: 2,
        protection: WRITE_PROTECTION.LOCKABLE,
        uuid: uuid(),
    },
    dynamic_lock_bytes: {
        start: page(0x820),
        length: 3,
        protection: WRITE_PROTECTION.LOCKABLE,
        uuid: uuid(),
    },
    capability_container: {
        start: page(0x03),
        length: 4,
        protection: WRITE_PROTECTION.LOCKABLE,
        uuid: uuid(),
    },
    cfg0: {
        start: page(0x83),
        length: 4,
        protection: WRITE_PROTECTION.CONSTANT,
        uuid: uuid(),
    },
    cfg1: {
        start: page(0x84),
        length: 4,
        protection: WRITE_PROTECTION.CONSTANT,
        uuid: uuid(),
    },
    internal: {
        start: page(0x02, 1),
        length: 1,
        protection: WRITE_PROTECTION.CONSTANT,
    },
    rfui1: {
        start: page(0x82, 3),
        length: 1,
        protection: WRITE_PROTECTION.CONSTANT,
    },
    rfui2: {
        start: page(0x86, 2),
        length: 2,
        protection: WRITE_PROTECTION.CONSTANT,
    },
    data: {
        start: page(0x04),
        length: 500,
        protection: WRITE_PROTECTION.LOCKABLE,
        uuid: uuid(),
    }
};

const uuidMap = {};
Object.keys(dynamicData).forEach(name => {
    uuidMap[dynamicData[name].uuid] = name;
});

const data = new Uint8Array(580);

// function advertise() {
//     NRF.setAdvertising({
//         0x180F: Puck.getBatteryPercentage(),
//     }, { name: 'AmiiBoy', showName: true, discoverable: true });
// }
//
// let advertisingInterval = setInterval(() => {
//     advertise();
// }, 30000);
//
// advertise();

const services = {};
services[advertisingUuid] = {};
services[0x180f] = {};
services[0x180f][0x2a19] = {
    value: Puck.getBatteryPercentage(),
    readable: true,
    broadcast: true,
    maxLen: 10,
};

// console.log(JSON.stringify(dynamicData, null, 2));

Object.keys(dynamicData).forEach(name => {
    const dataDef = dynamicData[name];
    if (! dataDef.uuid) {
        return;
    }
    services[advertisingUuid][dataDef.uuid] = {
        value: new Uint8Array(data.buffer, dataDef.start, dataDef.length),
        writable: true,
        readable: true,
        notify: dataDef.protection === WRITE_PROTECTION.LOCKABLE,
        onWrite: function(evt) {
            data.set(evt.data, dataDef.start);
        }
    }
});


NRF.setConnectionInterval({minInterval:250, maxInterval:1000})
NRF.setServices(
    services,
    {
        uart: false,
        advertise: ['180f', advertisingUuid],
    }
);
NRF.setTxPower(4);

const advertising = {
    0x180F: [Puck.getBatteryPercentage()],
};

advertising[advertisingUuid] = [1];

const name = 'AmiiBoy ' + NRF.getAddress().replace(/:/g, '').substr(0, 4);

NRF.setAdvertising(
    advertising,
    {
        name,
        showName: true,
        discoverable: true,
        connectable: true,
        scannable: true,
        interval: 375,
    }
);

console.log(name);
console.log(NRF.getAddress());
console.log(advertisingUuid);