const cheerio = require('cheerio');
const superagent = require('superagent');
require('superagent-proxy')(superagent);  // 引入SuperAgent-proxy
const xpath = require('xpath');
const htmlparser2 = require("htmlparser2");
const agent = superagent.agent(); // 保持session
let iniParser = require('iniparser');
let config = iniParser.parseSync('./resource/config.ini');
let proxy =  config['COMMON']['proxy'];


async function getWeather(province, city) { //获取墨迹天气
    if (province !== null) province = province.toLowerCase();
    if (city !== null) city = city.toLowerCase();
    let url = 'https://tianqi.moji.com/weather/china/'+province+'/'+city;
    let res = await req(url,'GET');
    let $ = cheerio.load(res.text);
    let weatherTips = $('.wea_tips em').text();
    if (weatherTips === null) weatherTips = '暂不不支持所在地区天气查询';
    const today = $('.forecast .days').first().find('li');
    let todayInfo = {
        Day:$(today[0]).text().replace(/(^\s*)|(\s*$)/g, ""),
        WeatherText:$(today[1]).text().replace(/(^\s*)|(\s*$)/g, ""),
        Temp:$(today[2]).text().replace(/(^\s*)|(\s*$)/g, ""),
        Wind:$(today[3]).find('em').text().replace(/(^\s*)|(\s*$)/g, ""),
        WindLevel:$(today[3]).find('b').text().replace(/(^\s*)|(\s*$)/g, ""),
        PollutionLevel:$(today[4]).find('strong').text().replace(/(^\s*)|(\s*$)/g, "")
    };
    return  {
        weatherTips: weatherTips,
        todayWeather: todayInfo.Day + ':' + todayInfo.WeatherText + '\r\n' + '温度:' + todayInfo.Temp + '\r\n'
            + todayInfo.Wind + todayInfo.WindLevel + '\r\n' + '空气:' + todayInfo.PollutionLevel + '\r\n'
    }
}

async function getDDIStatus() {
    let result = "default str";
    let post_data = {
        "cmsName": config['DS']['ds_cmsName'],
        "userName": config['DS']['ds_user'],
        "password": config['DS']['ds_password'],
        "authType": "secEnterprise",
        "cmsVisible": "true",
        "isFromLogonPage": "true",
        "sessionCookie": "true",
        "persistCookies": "true",
        "service": "/admin/App/appService.jsp",
        "formAction": "logon"
    };
    // 登陆验证
    let res = await reqForLogin(`http://` + config['DS']['ds_domain'] + `/DataServices/launch/logon`,'POST', post_data);
    // Into Repo
    post_data = {
        "REPOSITORY_NAME": 'az_bods_repo_cda',
        "JobName": 'JOB_AZ_CDA_RPT_DWH_1'
    };
    res = await reqForLogin(`http://cndcwprdetlp002:8080/DataServices/servlet/AwBatchJobHistory?REPOSITORY_NAME=az_bods_repo_cda`,'GET', post_data)
    let $ = cheerio.load(res.text);
    $('table.JCActaHTMLTableSortable tbody tr td img').each(function(index, element) {
        const el = $(element);
        let repoName = el.attr('src');
        if (repoName.indexOf('../images/circred.gif') >= 0) {
            console.log(repoName + 'DDI相关JOB 异常');
            result = "DDI相关JOB 存在异常 请查看以下地址\r\n" +
                "http://cndcwprdetlp002:8080/DataServices/servlet/AwBatchJobHistory?REPOSITORY_NAME=az_bods_repo_cda"
        } else {
            result = "DDI相关JOB 检查无异常"
        }
    });
    return result;
}

//请求
function req(url,method, params, data, cookies) {
    return new Promise(function (resolve,reject) {
        superagent(method, url)
            .query(params)
            .proxy(proxy)
            .send(data)
            .set('Content-Type','application/x-www-form-urlencoded')
            .end(function (err, response) {
                if (err) {
                    reject(err)
                }
                resolve(response)
            })
    })
}

//请求
function reqForLogin(url,method, data, cookies) {
    return new Promise(function (resolve,reject) {
        agent.post(url)
            .send(data)
            .set('Content-Type','application/x-www-form-urlencoded')
            .end(function (err, response) {
                if (err) {
                    reject(err)
                }
                resolve(response)
            })
    })
}

function closeHTML(str){
    let arrTags=["META","base","link","span","font","b","u","i","h1","h2","h3","h4","h5","h6","p","li","ul","table","div"];
    for(let i=0;i<arrTags.length;i++){
        let intOpen=0;
        let intClose=0;
        let re=new RegExp("\\<"+arrTags[i]+"( [^\\<\\>]+|)\\>","ig");
        let arrMatch=str.match(re);
        if(arrMatch!=null) intOpen=arrMatch.length;
        re=new RegExp("\\<\\/"+arrTags[i]+"\\>","ig");
        arrMatch=str.match(re);
        if(arrMatch!=null) intClose=arrMatch.length;
        for(let j=0;j<intOpen-intClose;j++){
            str+="</"+arrTags[i]+">";
        }
        /*for(var j=(intOpen-intClose-1);j>=0;j--){
        str+="</"+arrTags[i]+">";
        }*/
    }
    return str;
}

module.exports ={
    getWeather,
    getDDIStatus
};


/*

(async (str, type) => {
    process.on('unhandledRejection', (reason, p) => {
        console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
        // application specific logging, throwing an error, or other logic here
    });
    let post_data = {
        "cmsName": config['DS']['ds_cmsName'],
        "userName": config['DS']['ds_user'],
        "password": config['DS']['ds_password'],
        "authType": "secEnterprise",
        "cmsVisible": "true",
        "isFromLogonPage": "true",
        "sessionCookie": "true",
        "persistCookies": "true",
        "service": "/admin/App/appService.jsp",
        "formAction": "logon"
    };
    // 登陆验证
    let res = await reqForLogin(`http://` + config['DS']['ds_domain'] + `/DataServices/launch/logon`,'POST', post_data);
    // Into Repo
    post_data = {
        "REPOSITORY_NAME": 'az_bods_repo_cda',
        "JobName": 'JOB_AZ_CDA_RPT_DWH_1'
    };
    res = await reqForLogin(`http://cndcwprdetlp002:8080/DataServices/servlet/AwBatchJobHistory?REPOSITORY_NAME=az_bods_repo_cda`,'GET', post_data)
    let $ = cheerio.load(res.text);
    $('table.JCActaHTMLTableSortable tbody tr td img').each(function(index, element) {
        const el = $(element);
        let repoName = el.attr('src');
        if (repoName.indexOf('../images/circred.gif') >= 0) {
            console.log(repoName + 'DDI JOB 异常');
        }
    });
})();
*/
