const { Wechaty } = require('wechaty');
const { PuppetPadplus } = require ('wechaty-puppet-padplus');
const QrcodeTerminal = require('qrcode-terminal');
const OrclUtil = require('./util/orcl-util');
const sihuo = require('./util/sihuo');
const BAU_schedule = require("./schedule/BAU-schedule");
let iniParser = require('iniparser');
let config = iniParser.parseSync('resource/config.ini');

const token = config['SECRET']['token'];

const puppet = new PuppetPadplus({
    token,
});

const name  = 'bot-data-for-bau'

const bot = new Wechaty({
    puppet,
    name, // generate xxxx.memory-card.json and save login data for the next login
});

// 登录
async function onLogin (user) {
    console.log(`${user}登录了`)
    // 登陆后创建连接池
    await OrclUtil.initPool();
    // 登陆后创建定时任务
    await BAU_schedule.initBAU(bot);
}

//scan
function onScan(qrCode, status) {
    console.log('onScan Event!');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCode)}`)
    QrcodeTerminal.generate('This will be a small QRCode, eh!', {small: true}, function (qrCode) {
        console.log(qrCode)
    });
}

//登出
function onLogout(user) {
    console.log(`${user} 登出`)
}

// message
async function onMessage(msg) {
    /*if (msg.self()) {
            return
        }*/
    if (msg.type() !== bot.Message.Type.Text && msg.type() !== bot.Message.Type.Recalled) {
        return
    }
    const content = msg.text();
    const contact = msg.from();
    const room = msg.room();
    let say_someting = null;
    let sayOrquiet = false;
    let contact_for_say = null;

    if (room === null) {
        // console.log(`Message in Room: Content: ${content}, Contact: ${contact}`);
        contact_for_say = contact;
    } else {
        // console.log(`Message in Person: Content: ${content}, Contact: ${contact}, Room: ${await room.topic()}`)
        contact_for_say = room;
    }
    // 撤回处理
    console.log(msg.type());
    if (msg.type() === bot.Message.Type.Recalled) {
        console.log('RecalledEvent!');
        const recalledMessage = await msg.toRecalled();
        say_someting = '撤回事件激活：\r\n' + recalledMessage;
        let me = await bot.Contact.find({name:'王某人'});
        if (room === null) {
            me.say(say_someting);
        } else {
            room.sync();
            // let room = bot.Room.load('xxxx@chatroom');
            console.log(room);
            let topic = await room.topic();
            // room.say(say_someting);
            if (topic.indexOf('佬常') >= 0) {
                console.log('recalled for 佬常');
                room.say(say_someting);
            } else {
                console.log('recalled for me');
                me.say(say_someting);
            }
        }
        console.log(`Message: ${recalledMessage} has been recalled.`)
    }
    if (content === 'wechaty') {
        say_someting = 'welcome to wechaty!';
        await contact_for_say.say(say_someting);
    } else if (content.indexOf('活动推送查询') >= 0) { // 活动推送查询 + event_id
        sayOrquiet = true;
        console.log('活动查询event！');
        (async () => {
            let event_id = content.slice(6, content.length);
            let result = await OrclUtil.executeSql('edwpool', `select * from EDW_DATA.DWL_EVENT_WEBCAST where event_id=\'${event_id}\'`)
            console.log(result.rows);
            if (result.rows.length > 0) {
                say_someting = event_id + '推送时间：' + result.rows[0][3];
            } else {
                say_someting = '此活动没有推送记录';
            }
            await contact_for_say.say(say_someting);
            console.log('say_someting=' + say_someting);
        })();
    } else if (content.indexOf('直播间房间查询') >= 0) { // 直播间房间查询 + il_id
        sayOrquiet = true;
        console.log('直播间房间查询event！');
        (async () => {
            let il_id = content.slice(7, content.length);
            let result = await OrclUtil.executeSql('edwpool', `SELECT * FROM webcast.az_webcast_stg_room sr where sr.il_id=\'${il_id}\'`);
            console.log(result.rows);
            if (result.rows.length > 0) {
                say_someting = '此房间数据如下' + '：\r\nil_id=' + result.rows[0][0]
                    + '\r\nesm_id=' + result.rows[0][1] + '\r\naz_account=' + result.rows[0][4]
                    + '\r\nname=' + result.rows[0][3] + '\r\nbegin_live_time=' + result.rows[0][10]
                    + '\r\nend_live_time=' + result.rows[0][8];
            } else {
                say_someting = '无此房间数据';
            }
            await contact_for_say.say(say_someting);
            console.log('say_someting=' + say_someting);
        })();
    } else if(content.indexOf('员工查询') >= 0) {
        sayOrquiet = true;
        console.log('员工查询event！');
        (async () => {
            let prid = content.slice(4, content.length).toUpperCase();
            let result = await OrclUtil.executeSql('edwpool', `select * from publish.az_mdm_employee_master t where t.prid = \'${prid}\'`);
            console.log(result.rows);
            if (result.rows.length > 0) {
                say_someting = prid + '员工数据如下：\r\n' + "En Name：" + result.rows[0][25] + '\r\n' +
                    'Birthday：' + result.rows[0][5] + '\r\n' + 'Email：' + result.rows[0][33] + '\r\n' +
                    'ESM_USER_TYPE：' + result.rows[0][153] + '\r\n' + 'ESM_BU：' + result.rows[0][155] + '\r\n' +
                    'ManagerPrid：' + result.rows[0][156];
            } else {
                say_someting = prid + ' 无此员工或非内部员工';
            }
            await contact_for_say.say(say_someting);
            console.log('say_someting=' + say_someting);
        })();
    } else if(content === '天气预报') {
        console.log('天气预报event！');
        sayOrquiet = true;
        await contact.sync();
        let province = contact.province();
        let city = contact.city();
        console.log(city, province);
        let weather = await sihuo.getWeather(province, city);
        say_someting = city + '今日天气\r\n' + weather.weatherTips +'\r\n' +weather.todayWeather;
        await contact_for_say.say(say_someting)
    } else {
        sayOrquiet = false;
    }

    console.log('sayOrquiet=' + sayOrquiet);
}

bot
    .on('scan', onScan)
    .on('message', onMessage)
    .on('login',   onLogin)
    .on('logout',  onLogout)
    .start()
    .then(() => console.log('开始登陆微信'))
    .catch(e => console.error(e));