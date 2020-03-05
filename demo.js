const { Wechaty } = require('wechaty');
const { PuppetPadplus } = require ('wechaty-puppet-padplus');
let iniParser = require('iniparser');
let config = iniParser.parseSync('resource/config.ini');

const token = config['SECRET']['token'];
const puppet = new PuppetPadplus({
    token,
});
const name  = 'bot-data-for-bau';
const bot = new Wechaty({
    puppet,
    name, // generate xxxx.memory-card.json and save login data for the next login
});

bot
    .on('login',   `./listener/on-login`)
    .on('scan', `./listener/on-scan`)
    .on('message', `./listener/on-message`)
    .on('logout',  onLogout)
    .start()
    .then(() => console.log('开始登陆微信'))
    .catch(e => console.error('捕捉error\r\n' + e));

module.exports = bot;