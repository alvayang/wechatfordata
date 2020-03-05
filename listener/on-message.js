const OrclUtil = require('./../util/orcl-util');
const sihuo = require('./../util/sihuo');
const fs = require('fs');
const { FileBox } = require('file-box');
const FileUtil = require('./../util/file-util');
let bot = require('./../demo');

// Message
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
            let result = await OrclUtil.executeSql('edwpool', `select * from EDW_DATA.DWL_EVENT_WEBCAST where event_id=\'${event_id}\'`);
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
        let fileBox_audience = null;
        (async () => {
            let il_id = content.slice(7, content.length);
            let result = await OrclUtil.executeSql('edwpool', `SELECT dr.room_id,
              ROUND((((dr.end_live_time-to_date('19700101','yyyymmdd'))*86400 -
              to_number(substr(tz_offset(sessiontimezone),1,3))*3600) -
              ((dr.begin_live_time-to_date('19700101','yyyymmdd'))*86400 -
              to_number(substr(tz_offset(sessiontimezone),1,3))*3600))/60,2) AS duration,
              (SELECT count(distinct dp.pic_id) FROM webcast.az_webcast_dwh_room_picture dp where dp.il_id='66191') as pic_count，
              dr.name,dr.begin_live_time,dr.end_live_time
              FROM webcast.az_webcast_dwh_room dr,webcast.az_webcast_dwh_room_picture dp
              where dr.room_id=\'${il_id}\' and rownum=1`);
            console.log(result.rows);
            if (result.rows.length > 0) {
                say_someting = '此房间数据如下' + '：\r\nroom_id：' + result.rows[0][0]
                    + '\r\n时长(min)：' + result.rows[0][1] + '\r\n照片数量：' + result.rows[0][2]
                    + '\r\n名称：' + result.rows[0][3] + '\r\n开始时间：' + result.rows[0][4]
                    + '\r\n结束事件：' + result.rows[0][5];
                let audience = await OrclUtil.executeSql('edwpool', `SELECT da.room_id,
                  NVL2(da.SSO_ID,da.SSO_ID||'-'||da.USERNAME,da.e_account_id||'-'||da.e_account_name) audience_name
                  FROM webcast.az_webcast_dmt_audience da
                  where da.room_id=\'${il_id}\'`);
                if (audience.rows.length > 0 && audience.rows.length <= 500) {
                    FileUtil.delDir('files');
                    for (let i = 0;i < audience.rows.length;i++) {
                        fs.appendFile('files/audience_' + il_id + '.txt',audience.rows[i][1] + '\r\n','utf8',function(err){
                            if(err) {
                                console.log('写文件出错了，错误是：'+err);
                            }
                        });
                    }
                    fileBox_audience = FileBox.fromFile('files/audience_' + il_id + '.txt', result.rows[0][3] + ' 参会者名单.txt');
                } else {
                    say_someting += '\r\n参会者过多,请在报告端查看';
                }
            } else {
                say_someting = '无此房间数据';
            }
            await contact_for_say.say(say_someting);
            await contact_for_say.say(fileBox_audience);
            console.log('say_someting=' + say_someting);
        })().then().catch(e => console.error('捕捉error\r\n' + e));
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

module.exports = onMessage;