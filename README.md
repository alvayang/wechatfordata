# wechatfordata

新冠疫情爆发于2020年2月，某大型跨国药企业务数据的响应与维护工作随着疫情爆发迅速提升，一时间状态近于pc、微信24小时在线，找到合适的开源解决方案成为目前乃至长期的救命稻草。

## Install

> 引用 Blockquotes本应用基于wechaty pad协议开发，安装准备如下：

### 1. Init
> check your Node version first
```
node --version // v10.16.0 (BTW v10.0.0 < version < v11.0.0 is better)
```
```
mkdir my-padplus-bot && cd my-padplus-bot
npm init -y
```
### 2. Install the latest wechaty
```
npm install wechaty@next
```
### 3. Install wechaty-puppet-padplus
> Notice: wechaty-puppet-padplus still in alpha test period, so we keep updating the package, you should install the latest packge by using @latest until we release the stable package.
```
npm install wechaty-puppet-padplus@latest
```
### 4. Install other dependency
> There's no need to install wechaty-puppet in my-padplus-bot
```
npm install qrcode-terminal
```
### 5. Re-Install all related package
> If step 1~4 can not help you install successfully, please try this suggestion, otherwise just skip it please.
```
rm -rf node_modules package-lock.json
npm install
```

## Usage

```
```

## Contributing

PRs accepted.

## License

MIT © Kelly Cheng
