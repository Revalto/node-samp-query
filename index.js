const dgram = require('dgram');
const { off } = require('process');

class SampQuery {
    constructor(options) {
        this.ip = options.ip || '127.0.0.1';
        this.port = options.port || 7777;
        this.timeout = 1000;
    }

    async getServerInfo() {
        return await Promise.all(
            ["i", "r", "d"].map(async (res) => await this.request(res))
        );
    }

    async getServerProperties() {
        return await this.request('r');
    }

    async getServerOnline() {
        return (await this.request('i')).players;
    }

    async getServerMaxPlayers() {
        return (await this.request('i')).maxplayers;
    }

    async getServerName() {
        return (await this.request('i')).servername;
    }

    async getServerGamemodeName() {
        return (await this.request('i')).gamemodename;
    }

    async getServerLanguage() {
        return (await this.request('i')).language;
    }

    async getServerVersion() {
        return (await this.request('r')).version;
    }

    async getServerWeather() {
        return (await this.request('r')).weather;
    }

    async getServerWebSite() {
        return (await this.request('r')).weburl;
    }

    async getServerWorldTime() {
        return (await this.request('r')).worldtime;
    }

    async getServerPlayers() {
        const maxPlayers = await this.getServerOnline();

        if (maxPlayers > 100) {
            throw new Error(`More 100 players on server`)
        }

        return await this.request('c')
    }

    async getServerPlayersDetailed() {
        const maxPlayers = await this.getServerOnline();

        if (maxPlayers > 100) {
            throw new Error(`More 100 players on server`)
        }

        return await this.request('d')
    }

    async getServerPing() {
        const startTime = new Date().getTime();
        const res = await this.request('i');

        return (new Date().getTime() - startTime);
    }

    request(opcode) {
        return new Promise((resolve, reject) => {
            const socket = dgram.createSocket("udp4");
            let packet = Buffer.alloc(10 + opcode.length);

            packet.write('SAMP');
            packet[4] = this.ip.split('.')[0];
            packet[5] = this.ip.split('.')[1];
            packet[6] = this.ip.split('.')[2];
            packet[7] = this.ip.split('.')[3];
            packet[8] = this.port & 0xFF;
            packet[9] = this.port >> 8 & 0xFF;
            packet[10] = opcode.charCodeAt(0);

            try {
                socket.send(packet, 0, packet.length, this.port, this.ip);
            } catch (e) {
                console.log(e);
                reject(e);
            }

            let controller = setTimeout(function () {
                socket.close();
                reject(`[error] host unavailable - ${this.ip}:${this.port}`);
            }, 2000);

            socket.on('message', function (message) {
                if (controller) clearTimeout(controller);

                if (message.length < 11) {
                    reject(`[error] invalid socket on message - ${message}`)
                }

                else {
                    socket.close();
                    message = message.slice(11);

                    let offset = 0;

                    if (opcode === 'i') {
                        const closed = !!message.readUInt8(offset);
                        const players = message.readUInt16LE(offset += 1);
                        const maxPlayers = message.readUInt16LE(offset += 2);

                        let serverName = message.readUInt16LE(offset += 2);
                        serverName = message.slice(offset += 4, offset += serverName).toString();

                        let gameModeName = message.readUInt16LE(offset);
                        gameModeName = message.slice(offset += 4, offset += gameModeName).toString();

                        let language = message.readUInt16LE(offset);
                        language = message.slice(offset += 4, offset += language).toString();

                        resolve({ serverName, gameModeName, players, maxPlayers, language, closed });
                    }
                    else if (opcode === 'r') {
                        offset += 2;

                        const object = [
                            ...new Array(message.readUInt16LE(offset - 2))
                                .fill({})
                        ].map(() => {
                            let property = message.readUInt8(offset);
                            property = message.slice(++offset, offset += property).toString();

                            let propertyvalue = message.readUInt8(offset);
                            propertyvalue = message.slice(++offset, offset += propertyvalue).toString();

                            return { [property]: propertyvalue }
                        })

                        resolve(object);
                    }
                    else if (opcode === 'd') {
                        offset += 2;

                        const object = [
                            ...new Array(Math.floor(message.readUInt16LE(offset - 2)))
                                .fill({})
                        ].map(() => {
                            const id = message.readUInt8(offset);

                            let name = message.readUInt8(++offset);
                            name = message.slice(++offset, offset += name).toString();

                            const score = message.readUInt16LE(offset);
                            const ping = message.readUInt16LE(offset += 4);

                            offset += 4;

                            return { id, name, score, ping };
                        });

                        resolve(object);
                    }
                    else if (opcode === 'c') {
                        offset += 2;

                        const object = [
                            ...new Array(Math.floor(message.readUInt16LE(offset - 2)))
                                .fill({})
                        ].map(() => {
                            let name = message.readUInt8(offset);
                            name = message.slice(++offset, offset += name).toString();

                            const score = message.readUInt16LE(offset);

                            offset += 4;

                            return { name, score };
                        });

                        resolve(object);
                    }
                }
            });
        })
    }
}

module.exports = SampQuery;