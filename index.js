#!/usr/bin/env node

const cp = require('child_process');

const { RUN_TIMEOUT = 3600 * 1000, RUN_KILL_TIMEOUT = 100 } = process.env;
const [command, checkString, ...ports] = process.argv.slice(2);

main(command, checkString, ports);
module.exports = main;

function main (command, checkString, ports = []) {
    const child = cp.spawn('bash', ['-c', command], {
        timeout: RUN_TIMEOUT,
    });
    let str = '';

    const killPorts = () => {
        for (const port of ports) {
            const x = cp.spawnSync('bash', [
                '-c',
                `pid=$(lsof -i:${port} -stcp:listen | awk '$2~/^[0-9]+$/{print $2}'); [ "$pid" ] && kill $pid; true`,
            ]);
            const killOutput = `${x.stdout}${x.stderr}`.trim();
            killOutput && console.log(`kill ${port} error:`, killOutput);
        }
    }
    const handler = type => data => {
        str += data;
        process[type].write(data);
        if (str.includes(checkString)) {
            str = '';
            setTimeout(killPorts, RUN_KILL_TIMEOUT)
        }
    };
    child.stdout.on('data', handler('stdout'));
    child.stderr.on('data', handler('stderr'));
}