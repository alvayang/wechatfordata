const schedule = require('../util/schedule-util');
const OrclUtil = require('../util/orcl-util');
const sihuo = require('../util/sihuo');

// 创建每日定时任务
async function initBAU(bot) {
    console.log(`设定每日BAU Daily Check`);
    // ESM JOB Check
    let say_bau = '';
    let rule = schedule.getScheduleRule();
    rule.dayOfWeek = [0, new schedule.getScheduleRange(1, 5)];
    rule.hour = 11;
    rule.minute = 45;
    schedule.setSchedule(rule, async () => {
        (async () => {
            say_bau = '------ESM JOB Check------\r\n';
            let result = await OrclUtil.executeSql('edwpool', `SELECT * FROM EDW_DATA.meta_etl_scheduler where (etl_job_type like '%ESM%' or etl_job_type like '%WEBCAST%') and batchid = to_char(sysdate, 'yyyymmdd') order by end_time asc`);
            console.log(result.rows);
            if (result.rows.length > 0) {
                for (let i = 0;i < result.rows.length;i++) {
                    let num = i + 1;
                    say_bau += 'No' + num + '\r\n' + 'BATCHID：' + result.rows[i][0] + '\r\n' + 'ETL_JOB_TYPE：' + result.rows[i][1] + '\r\n'
                        + 'STATUS_FLAG：' + result.rows[i][2] + '\r\n' + 'START_TIME：' + result.rows[i][3] + '\r\n' + 'END_TIME：' + result.rows[i][4] + '\r\n'
                }
            } else {
                say_bau = 'e=ESM JOB 未启动';
            }
            // const room = await bot.Room.find({topic: '佬常头部二号'});
            const contact = await bot.Contact.find({name: '王某人'});
            await contact.say(say_bau);
            console.log('say_bau=' + say_bau);
        })();
    });
    // Webcasting Data Sync Check
    rule = schedule.getScheduleRule();
    rule.dayOfWeek = [0, new schedule.getScheduleRange(1, 5)];
    rule.hour = 8;
    rule.minute = 35;
    schedule.setSchedule(rule, async () => {
        (async () => {
            say_bau = '---Webcasting Sync Check---\r\n';
            let room_count = await OrclUtil.executeSql('edwpool', `SELECT count(*) FROM webcast.AZ_WEBCAST_STG_ROOM`);
            let room_pic_count = await OrclUtil.executeSql('edwpool', `SELECT count(*) FROM webcast.AZ_WEBCAST_STG_ROOM_PICTURE`);
            let room_doc_count = await OrclUtil.executeSql('edwpool', `SELECT count(*) FROM webcast.AZ_WEBCAST_STG_DOCUMENT`);
            let aud_count = await OrclUtil.executeSql('edwpool', `SELECT count(*) FROM webcast.AZ_WEBCAST_STG_AUDIENCE`);
            let inaud_count = await OrclUtil.executeSql('edwpool', `SELECT count(*) FROM webcast.AZ_WEBCAST_STG_INAV_AUDIENCE`);
            let qes_count = await OrclUtil.executeSql('edwpool', `SELECT count(*) FROM webcast.AZ_WEBCAST_STG_SURVEY`);
            let ans_count = await OrclUtil.executeSql('edwpool', `SELECT count(*) FROM webcast.AZ_WEBCAST_STG_SURVEY_ANSWER`);
            say_bau += '房间同步数量：' + room_count.rows[0][0] + '\r\n' + '照片同步数量：' + room_pic_count.rows[0][0] + '\r\n' +
                'document同步数量：' + room_doc_count.rows[0][0] + '\r\n' + '参会者同步数量：' + aud_count.rows[0][0] + '\r\n' +
                '互动参会者同步数量：' + inaud_count.rows[0][0] + '\r\n' + '问卷同步数量：' + qes_count.rows[0][0] + '\r\n' +
                '问卷answer同步数量：' + ans_count.rows[0][0] + '\r\n';
            const room = await bot.Room.find({topic: 'CDC直播间报告 内部沟通群'});
            // const contact = await bot.Contact.find({name: '文件传输助手'});
            await room.say(say_bau);
            console.log('say_bau=' + say_bau);
        })();
    });
    // 夹带私货
    rule = schedule.getScheduleRule();
    rule.dayOfWeek = [0, new schedule.getScheduleRange(1, 7)];
    rule.hour = 6;
    rule.minute = 30;
    schedule.setSchedule(rule, async () => {
        let contact = await bot.Contact.find({name:'dong~dong~'});
        let weather = await sihuo.getWeather();
        let str = '今日天气\r\n' + weather.weatherTips +'\r\n' +weather.todayWeather;
        await contact.say(str)
    });
    // DDI JOB
    rule = schedule.getScheduleRule();
    rule.dayOfWeek = [0, new schedule.getScheduleRange(1, 7)];
    rule.hour = 22;
    rule.minute = 30;
    schedule.setSchedule(rule, async () => {
        let contact = await bot.Contact.find({name:'王某人'});
        let str = await sihuo.getDDIStatus();
        console.log(str);
        await contact.say(str);
    });
}

module.exports = {
    initBAU
};