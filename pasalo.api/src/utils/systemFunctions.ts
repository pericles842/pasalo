import os from 'os';

/**
 *Obteiene la ip para saber si esta en local o produccion
 *
 * @export
 * @return {*}  {string}
 */
export function getLocalIp(): string {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        if (!iface) continue;
        for (const config of iface) {
            if (config.family === 'IPv4' && !config.internal) {
                return config.address;
            }
        }
    }
    return 'localhost';
}