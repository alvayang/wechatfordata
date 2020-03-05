const OrclUtil = require('./../util/orcl-util');
const BAU_schedule = require('./../schedule/BAU-schedule');
let bot = require('./../demo');

// 登录
async function onLogin (user) {
    console.log(`${user}登录了`);
    // 登陆后创建连接池
    await OrclUtil.initPool();
    // 登陆后创建定时任务
    await BAU_schedule.initBAU(bot);
}

module.exports = onLogin;