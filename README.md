# node-samp-query

## Installation
npm i node-samp-query

## Example
```
const SampQuery = require('node-samp-query');

const samp = new SampQuery({
    ip: `delirium-amber.ru`,
    port: 7777
});

const start = async() => {
    const data = await samp.getServerInfo();

    console.log(data);
}

/*

Output:

[
  {
    serverName: 'DELIRIUM AMBER | STALKER, DayZ, RUST',
    gameModeName: 'Delirium (RPG STALKER DayZ) UA',
    players: 4,
    maxPlayers: 50,
    language: 'RU',
    closed: false
  },
  [
    { lagcomp: 'On' },
    { mapname: 'Delirium 4.1.1 BUILD 4100' },
    { version: '0.3.7-R2' },
    { weather: '5' },
    { weburl: 'delirium-amber.ru' },
    { worldtime: '00:00' }
  ],
  [
    { id: 0, name: 'Revalto', score: 99, ping: 40 },
    { id: 1, name: 'Kizary', score: 4, ping: 46 },
    { id: 2, name: 'Mr_Freeman', score: 12, ping: 36 },
    { id: 4, name: 'z3fox', score: 46, ping: 34 }
  ]
]

*/

start();
```