import utils from './utils';
import logger from './logger';
import md5 from 'md5';
import _ from 'lodash';
import superagent from 'superagent';

const APP_VERSION = "2.34.1";

export default class MihoYoApi {
  DEVICE_ID = utils.randomString(32).toUpperCase();
  DEVICE_NAME = utils.randomString(_.random(1, 10));
  USER_AGENT_MIYOUSHE = "Hyperion/360 CFNetwork/1408.0.4 Darwin/22.5.0";
  USER_AGENT_WECHAT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36";


  async srWeChatListTasks (): Promise<any> {
    const url = "https://api-takumi.mihoyo.com/event/pointsmall/task/index";
    let res = await superagent
        .get(url)
        .set(this._getWeChatHeader())
        .timeout(10000);
    let resObj = JSON.parse(res.text);
    logger.debug(`WeChatListTasks: ${res.text}`);
    return resObj;
  }

  async srCompleteWeChatTask(id: string): Promise<any> {
    const url = "https://api-takumi.mihoyo.com/event/pointsmall/task/finish";
    const signPostData = {
      id:id
    }

    let res = await superagent
        .post(url)
        .set(this._getWeChatHeader())
        .timeout(10000)
        .send(JSON.stringify(signPostData));
    let resObj = JSON.parse(res.text);
    logger.debug(`srCompleteWeChatTask: ${res.text}`);

    return resObj;
  }

  async srCompleteWeChatTasks(): Promise<any> {
    let obj = await this.srWeChatListTasks();
    for(let item of obj.data.list){
      if(item.state!="TaskInit"){
        logger.info(`正在完成任务: ${item.name} [跳过]`)
        continue;
      }
      logger.info(`正在完成任务: ${item.name}`)
      await this.srCompleteWeChatTask(item.id);
      await utils.randomSleepAsync();
    }
  }

  async srCollectWeChatTaskAward(id: string): Promise<any> {
    const url = "https://api-takumi.mihoyo.com/event/pointsmall/task/award/receive";
    const signPostData = {
      id:id
    }

    let res = await superagent
        .post(url)
        .set(this._getWeChatHeader())
        .timeout(10000)
        .send(JSON.stringify(signPostData));
    let resObj = JSON.parse(res.text);
    logger.debug(`srCollectWeChatTaskAward: ${res.text}`);

    return resObj;
  }

  async srCollectWeChatTaskAwards(): Promise<any> {
    let obj = await this.srWeChatListTasks();
    for(let item of obj.data.list){
      if(item.state!="TaskWait"){
        logger.info(`正在收集任务奖励: ${item.name} [跳过]`)
        continue;
      }
      logger.info(`正在收集任务奖励: ${item.name}`)
      await this.srCollectWeChatTaskAward(item.id);
      await utils.randomSleepAsync();
    }
  }


  async srCollectWeChatCumulateSignAward(id: string): Promise<any> {
    const url = "https://api-takumi.mihoyo.com/event/pointsmall/sign/award/receive";
    const signPostData = {
      id:id
    }

    let res = await superagent
        .post(url)
        .set(this._getWeChatHeader())
        .timeout(10000)
        .send(JSON.stringify(signPostData));
    let resObj = JSON.parse(res.text);
    logger.debug(`srCollectWeChatCumulateSignAward: ${res.text}`);

    return resObj;
  }


  async srWechatListCumulateSignAwards(): Promise<any>{
    const url = "https://api-takumi.mihoyo.com/event/pointsmall/sign/index";
    let res = await superagent
        .get(url)
        .set(this._getWeChatHeader())
        .timeout(10000);
    let resObj = JSON.parse(res.text);
    logger.debug(`WeChatCumulateSignAwards: ${res.text}`);
    return resObj;
  }


  async srCollectWeChatCumulateSignAwards(): Promise<any> {
    let obj = await this.srWechatListCumulateSignAwards();
    for(let item of obj.data.list){
      if(item.state!="SignTaskStateWait"){
        logger.info(`正在收集累签奖励: 累积签到${item.award_need_day}天 [跳过]`)
        continue;
      }
      logger.info(`正在收集累签奖励: 累积签到${item.award_need_day}天`)
      await this.srCollectWeChatCumulateSignAward(item.id);
      await utils.randomSleepAsync();
    }
  }

  async srEatWeChatTasks(): Promise<any>{
    await this.srCompleteWeChatTasks();
    await this.srCollectWeChatTaskAwards();
    await this.srCollectWeChatCumulateSignAwards();
    return {
      message:"OK"
    };
  }

  async lunaSign (): Promise<any> {
    const url = "https://api-takumi.mihoyo.com/event/luna/sign";
    const signPostData = {
      act_id: "e202304121516551",
      region: "prod_gf_cn",
      uid: process.env.SR_UID,
      lang: "zh-cn"
    }

    let res = await superagent
        .post(url)
        .set(this._getHeaderLunaSign(JSON.stringify(signPostData)))
        .timeout(10000)
        .send(JSON.stringify(signPostData));
    let resObj = JSON.parse(res.text);
    if(resObj.data!=null){
      if(resObj.data.is_risk){
        logger.error(`LunaSign: 需要输入验证码`);
      }
    }
    logger.debug(`LunaSign: ${res.text}`);

    return resObj;
  }

  async forumSign (forumId: string): Promise<any> {
    const url = "https://bbs-api.miyoushe.com/apihub/app/api/signIn";
    const signPostData = { gids: forumId };
    let res = await superagent
      .post(url)
      .set(this._getHeaderBBSSign(JSON.stringify(signPostData)))
      .timeout(10000)
      .send(JSON.stringify(signPostData));
    let resObj = JSON.parse(res.text);
    logger.debug(`ForumSign: ${res.text}`);

    return resObj;
  }

  async forumPostList (forumId: string): Promise<any> {
    const url = `https://api-takumi.mihoyo.com/post/api/getForumPostList?forum_id=${forumId}&is_good=false&is_hot=false&page_size=20&sort_type=1`;

    let res = await superagent.get(url).set(this._getHeader()).timeout(10000);
    let resObj = JSON.parse(res.text);
    logger.debug(`ForumList: ${res.text}`)
    return resObj;
  }

  async forumPostDetail (postId: string): Promise<any> {
    const url = `https://api-takumi.mihoyo.com/post/api/getPostFull?post_id=${postId}`;

    let res = await superagent.get(url).set(this._getHeader()).timeout(10000);
    let resObj = JSON.parse(res.text);
    logger.debug(`ForumDetail: ${res.text}`)
    return resObj;
  }

  async forumPostShare (postId: string): Promise<any> {
    const url = `https://api-takumi.mihoyo.com/apihub/api/getShareConf?entity_id=${postId}&entity_type=1`;

    let res = await superagent.get(url).set(this._getHeader()).timeout(10000);
    let resObj = JSON.parse(res.text);
    logger.debug(`ForumShare: ${res.text}`)
    return resObj;
  }

  async forumPostVote (postId: string): Promise<any> {
    const url = `https://api-takumi.mihoyo.com/apihub/sapi/upvotePost`;
    const upvotePostData = {
      "post_id": postId,
      "is_cancel": false
    }

    let res = await superagent.post(url).set(this._getHeader()).send(JSON.stringify(upvotePostData));
    let resObj = JSON.parse(res.text);
    logger.debug(`ForumVote: ${res.text}`)
    return resObj;
  }

  _getHeader (task?: "signIn" | "vote" | "share" | "detail" | "list", b?: string) {
    const randomStr = utils.randomString(6);
    const timestamp = Math.floor(Date.now() / 1000);

    // Android sign
    let sign = md5(`salt=z8DRIUjNDT7IT5IZXvrUAxyupA1peND9&t=${timestamp}&r=${randomStr}`);
    let DS = `${timestamp},${randomStr},${sign}`;
    if (task === "signIn") {
      const randomInt = Math.floor(Math.random() * (200000 - 100001) + 100001);
      sign = md5(`salt=t0qEgfub6cvueAPgR5m9aQWWVciEer7v&t=${timestamp}&r=${randomInt}&b=${b}&q=`);
      DS = `${timestamp},${randomInt},${sign}`;
    }

    return {
      'Cookie': process.env.S_COOKIE_STRING,
      "Content-Type": "application/json",
      "User-Agent": "okhttp/4.8.0",
      'Referer': "https://app.mihoyo.com",
      'Host': "bbs-api.mihoyo.com",
      "x-rpc-device_id": this.DEVICE_ID,
      "x-rpc-app_version": APP_VERSION,
      "x-rpc-device_name": this.DEVICE_NAME,
      "x-rpc-client_type": "2", // 1 - iOS, 2 - Android, 4 - Web
      "x-rpc-device_model": "Mi 10",
      "x-rpc-channel": "miyousheluodi",
      "x-rpc-sys_version": "6.0.1",
      DS,
    };
  }

  _getHeaderBBSSign(b?: string){
    const timestamp = Math.floor(Date.now() / 1000);

    // Android sign
    const randomInt = Math.floor(Math.random() * (200000 - 100001) + 100001);
    let sign = md5(`salt=t0qEgfub6cvueAPgR5m9aQWWVciEer7v&t=${timestamp}&r=${randomInt}&b=${b}&q=`);
    let DS = `${timestamp},${randomInt},${sign}`;

    return {
      'Cookie': process.env.S_COOKIE_STRING,
      "Content-Type": "application/json",
      "User-Agent": this.USER_AGENT_MIYOUSHE,
      'Referer': "https://app.mihoyo.com",
      'Host': "bbs-api.miyoushe.com",
      "x-rpc-device_id": this.DEVICE_ID,
      "x-rpc-app_version": "2.36.1",
      "x-rpc-device_name": this.DEVICE_NAME,
      "x-rpc-client_type": "2", // 1 - iOS, 2 - Android, 4 - Web
      "x-rpc-device_model": "Mi 10",
      "x-rpc-sys_version": "16.5.1",
      DS,
    };

  }

  _getHeaderLunaSign (b?: string) {
    const timestamp = Math.floor(Date.now() / 1000);

    // Android sign
    const randomInt = Math.floor(Math.random() * (200000 - 100001) + 100001);
    let sign = md5(`salt=t0qEgfub6cvueAPgR5m9aQWWVciEer7v&t=${timestamp}&r=${randomInt}&b=${b}&q=`);
    let DS = `${timestamp},${randomInt},${sign}`;

    return {
      'Cookie': process.env.L_COOKIE_STRING,
      "Content-Type": "application/json",
      "User-Agent": this.USER_AGENT_MIYOUSHE,
      'Referer': "https://webstatic.mihoyo.com/",
      'Host': "api-takumi.mihoyo.com",
      "x-rpc-device_id": this.DEVICE_ID,
      "x-rpc-app_version": "2.56.1",
      "x-rpc-client_type": "2",
      DS,
    };
  }

  _getWeChatHeader () {
    return {
      'Cookie': process.env.WECHAT_COOKIE_STRING,
      "Content-Type": "application/json",
      "User-Agent": this.USER_AGENT_WECHAT,
    };
  }
}
