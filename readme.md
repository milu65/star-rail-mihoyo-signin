# Mihoyo Star Rail sign in

自动完成星穹铁道米游币任务
- 论坛区签到
- 阅读帖子
- 点赞帖子
- 分享帖子

自动完成米游社星穹铁道月签到

自动完成微信每日任务

## 目前存在的问题
lunaSign执行多次后提示输入验证码，尝试修改Header看看有没有好转  
formSign在连续签到4天后返回1034代码，该代码似乎对应需要输入验证码，暂未解决之后通过抓包看看第五天的签到与第四天的签到请求有什么区别
wechatTasks没有编写连签奖励自动收集

## 免责声明
本项目使用脚本模拟米游社app、微信公众号网页进行自动化任务，存在封号、米游币清零等风险。   
如意外情况与作者无关。虽然目前没有出现封号情况不代表以后不会没有吧。先免责一下，本项目的只是兴趣爱好（如果天外飞锅，我是万万不会接的。）   
使用本程序默认接收免责协议。   

## 安全提醒  
1 Workflow 是所有注册用户都可见的，包括 log，在旧版本中有一些 log 可能会泄露你们的 cookie string，请所有运行旧版本的及时更换成新版本，
并且修改现有 mihoyo 账户密码！！！

2 目前仅调用了米游币任务所必须的接口，并未 100% 模拟读取帖子点赞的所有流程，存在一定不可知的风险，请使用前务必知晓，~~下一步的开发会尝试尽可能模拟手动做任务的全部接口调用。~~

## 更新记录
[2023.08.21] 现在支持论坛签到了。

[2023.08.20] 加入微信公众号任务，加入月签到任务。专精星穹铁道，其他的都给你阉了。

[2021.10.09] 重构部分代码，加入企业微信消息通知。

[2021.09.22] 通过网页获取 cookie 的方式已失效，请通过抓包方式获取 App 使用的 cookie。

[2020.11.16] 修复一时间后 cookie 失效的问题，重构部分代码以支持后期优化。

[2020.11.14] 感谢 [@lhllhx](https://github.com/lhllhx) 提醒，删除可能泄露 Cookie 的 log。

## 快速入门

### 安装依赖
```
yarn
```

### 获取 cookie (请使用抓包工具获取 stuid, stoken, login_ticket, ring_third_first_hkrpg_token等)

### 环境变量
| 名称                   | 值                                                       | 备注                                     |
|----------------------|---------------------------------------------------------|----------------------------------------|
| S_COOKIE_STRING      | stuid;stoken;login_ticket;mid                           | 通过抓包米游社自行获取                            |
| L_COOKIE_STRING      | ltuid;ltoken;login_ticket;account_id;cookie_token       | 通过抓包米游社自行获取                            |
| WECHAT_COOKIE_STRING | ring_third_first_hkrpg_token                            | 通过抓包微信自行获取                             |
| SR_UID               | uid                                                     | 通过抓包米游社POST BODY自行获取                   |
| QY_WECHAT=           | `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=` | 企业微信机器人 URL                            |
| DEBUG                | 1                                                       | 默认 info 级别, DEBUG = 1 则开启 debug 级别日志输出 |

### 本地运行
```bash
S_COOKIE_STRING='stuid=XXX;stoken=XXX;login_ticket=XXX;' L_COOKIE_STRING='account_id=XXX; cookie_token=XXX; login_ticket=XXX; ltoken=XXX; ltuid=XXX;' SR_UID='XXX' WECHAT_COOKIE_STRING='ring_third_first_hkrpg_token=XXX' node dist/main.js
```

## Workflow 运行 (谨慎选择)
### Fork 项目  

项目地址：https://github.com/jianggaocheng/mihoyo-signin  

点击右上角 `Fork` 到自己的账号下

### 添加 Cookie 至 Secrets
回到项目页面，依次点击Settings-->Secrets-->New secret

建立名为 `COOKIE_STRING` 的 secret，值为获取 cookie 中 COOKIE_STRING 的内容，最后点击 Add secret

### 启动 Github Action

> Actions 默认为关闭状态，Fork 之后需要手动执行一次，若成功运行其才会激活。

返回项目主页面，点击上方的`Actions`，再点击左侧的`Mihoyo StarRail SignIn`，再点击`Run workflow`

至此，部署完毕。

### 查看结果

当你完成上述流程，可以在 `Actions` 页面点击 `Mihoyo StarRail SignIn` --> `build` --> `run sign`查看结果。

### 更新程序

因为程序目前还在不断更新中，因此你 Fork 的仓库需要及时更新，更新的步骤如下。

```
git clone https://github.com/<Your GitHub ID>/star-rail-mihoyo-signin.git
cd ./star-rail-mihoyo-signin
git pull https://github.com/milu65/star-rail-mihoyo-signin.git master
git push origin master
```

## 感谢
forked from https://github.com/jianggaocheng/mihoyo-signin

受 https://github.com/lhllhx/miyoubi 项目启发  

感谢 https://github.com/lhllhx/miyoubi 的作者 [@lhllhx](https://github.com/lhllhx)  

感谢 [@2314933036](https://github.com/2314933036) 提供了签名 DS 字段的加密算法  
