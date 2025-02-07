import logger from './lib/logger';
import _ from 'lodash';
import moment from 'moment';
import promiseRetry from 'promise-retry';
import { NotifierInterface } from './lib/notifier/notifier';
import QyWechat from './lib/notifier/qy-wechat-notifier';
import utils from './lib/utils';
import MihoYoApi from './lib/mihoyo-api';
import * as ForumData from './data.json';

// 0. Golbal init
// Date
const START = moment().unix();
const TODAY_DATE:string = moment().format('YYYY-MM-DD');
const RETRY_OPTIONS: any = {
  retries: 3,
  minTimeout: 5000,
  maxTimeout: 10000
};

// Runtime environment check
if (_.isEmpty(process.env.S_COOKIE_STRING)) {
  logger.error('环境变量 S_COOKIE_STRING 未配置，退出...');
  process.exit();
}
if (_.isEmpty(process.env.L_COOKIE_STRING)) {
  logger.error('环境变量 L_COOKIE_STRING 未配置，退出...');
  process.exit();
}
if (_.isEmpty(process.env.WECHAT_COOKIE_STRING)) {
  logger.error('环境变量 WECHAT_COOKIE_STRING 未配置，退出...');
  process.exit();
}
if (_.isEmpty(process.env.SR_UID)) {
  logger.error('环境变量 SR_UID 未配置，退出...');
  process.exit();
}

// Register Notifier 
logger.info(`开始注册通知`)
const notifierList: NotifierInterface[] = [];

// Notifier - QyWechat
if (!_.isEmpty(process.env.QY_WECHAT)) {
  logger.info(`初始化企业微信通知`);
  notifierList.push(new QyWechat(process.env.QY_WECHAT!));
}

const sendReport = (message: string): void => {
  _.forEach(notifierList, (notifier: NotifierInterface) => {
    notifier.sendMarkdown(message);
  });
}

const miHoYoApi = new MihoYoApi();
logger.info(`DeviceID: ${miHoYoApi.DEVICE_ID} ${miHoYoApi.DEVICE_NAME}`);

let resultMessage = `**Star Rail Mihoyo 签到  ${TODAY_DATE}**\n\n`;


(async () => {
  
  //WeChat tasks

  resultMessage += `**WeChat StarRail Sign**\n`
  const wechatTaskName = "StarRail微信公众号任务"
  try {
    let resObj = await promiseRetry((retry: any, number: number) => {
      logger.info(`开始${wechatTaskName} 尝试次数: ${number}`);
      return miHoYoApi.srEatWeChatTasks().catch((e) => {
        logger.error(`${wechatTaskName}失败: [${e.message}] 尝试次数: ${number}`);
        return  retry(e);
      });
    }, RETRY_OPTIONS);
    logger.info(`${wechatTaskName}结果: [${resObj.message}]`);
    resultMessage += `${wechatTaskName}: [${resObj.message}]\n`;
  } catch(e) {
    logger.error(`${wechatTaskName}失败 [${e.message}]`);
    resultMessage += `${wechatTaskName}失败: [${e.message}]\n`;
  }
  await utils.randomSleepAsync();

  //Luna sign task

  for (let forum of (ForumData as any).default) {
    resultMessage += `**${forum.name}**\n`
    const taskName = "Luna签到-双数日"
    if(new Date().getDay()%2==1){
      break;
    }
    try {
      // 0 Luna Sign
      let resObj = await promiseRetry((retry: any, number: number) => {
        logger.info(`开始${taskName}: [${forum.name}] 尝试次数: ${number}`);
        return miHoYoApi.lunaSign().catch((e) => {
          logger.error(`${forum.name} ${taskName}失败: [${e.message}] 尝试次数: ${number}`);
          return  retry(e);
        });
      }, RETRY_OPTIONS);
      logger.info(`${forum.name} ${taskName}结果: [${resObj.message}]`);
      resultMessage += `${taskName}: [${resObj.message}]\n`;
    } catch(e) {
      logger.error(`${forum.name} ${taskName}失败 [${e.message}]`);
      resultMessage += `${taskName}失败: [${e.message}]\n`;
    }

    await utils.randomSleepAsync();
  }


  // Execute BBS Sign task
  for (let forum of (ForumData as any).default) {
    resultMessage += `**${forum.name}**\n`

    try {
      let resObj = await promiseRetry((retry: any, number: number) => {
        logger.info(`开始签到: [${forum.name}] 尝试次数: ${number}`);
        return miHoYoApi.forumSign(forum.id).catch((e) => {
          logger.error(`${forum.name} 签到失败: [${e.message}] 尝试次数: ${number}`);
          return  retry(e);
        });
      }, RETRY_OPTIONS);
      logger.info(`${forum.name} 签到结果: [${resObj.message}]`);
      resultMessage += `签到: [${resObj.message}]\n`;
    } catch(e) {
      logger.error(`${forum.name} 签到失败 [${e.message}]`);
      resultMessage += `签到失败: [${e.message}]\n`;
    }

    await utils.randomSleepAsync();
  }

  // Execute BBS post related task
  for (let forum of (ForumData as any).default) {
    resultMessage += `\n**${forum.name}**\n`

    try {
      // 2 BBS list post
      let resObj = await promiseRetry((retry: any, number: number) => {
        logger.info(`读取帖子列表: [${forum.name}] 尝试次数: ${number}`);
        return miHoYoApi.forumPostList(forum.forumId).catch((e) => {
          logger.error(`${forum.name} 读取帖子列表失败: [${e.message}] 尝试次数: ${number}`);
          return  retry(e);
        });
      }, RETRY_OPTIONS);
      logger.info(`${forum.name} 读取列表成功 [${resObj.message}]，读取到 [${resObj.data.list.length}] 条记录`);

      let postList = resObj.data.list.slice(0,10); // 限读10条
      for (let post of postList) {
        post = post.post;

        // 2.1 BBS read post
        let resObj = await promiseRetry((retry: any, number: number) => {
          logger.info(`读取帖子: [${post.subject}] 尝试次数: ${number}`);
          return miHoYoApi.forumPostDetail(post['post_id']).catch((e) => {
            logger.error(`${forum.name} 读取帖子失败: [${e.message}] 尝试次数: ${number}`);
            return  retry(e);
          });
        }, RETRY_OPTIONS); 

        logger.info(`${forum.name} [${post.subject}] 读取成功 [${resObj.message}]`);
        await utils.randomSleepAsync();
        
        // 2.2 BBS vote post
        resObj = await promiseRetry((retry: any, number: number) => {
          logger.info(`点赞帖子: [${post.subject}] 尝试次数: ${number}`);
          return miHoYoApi.forumPostVote(post['post_id']).catch((e) => {
            logger.error(`${forum.name} 点赞帖子失败: [${e.message}] 尝试次数: ${number}`);
            return  retry(e);
          });
        }, RETRY_OPTIONS); 

        logger.info(`${forum.name} [${post.subject}] 点赞成功 [${resObj.message}]`);
        await utils.randomSleepAsync();
      }

      // 2.3 BBS share post
      let sharePost = postList[0].post;
      resObj = await promiseRetry((retry: any, number: number) => {
        logger.info(`分享帖子: [${sharePost.subject}] 尝试次数: ${number}`);
        return miHoYoApi.forumPostShare(sharePost['post_id']).catch((e) => {
          logger.error(`${forum.name} 分享帖子失败: [${e.message}] 尝试次数: ${number}`);
          return  retry(e);
        });
      }, RETRY_OPTIONS); 
    } catch(e) {
      logger.error(`${forum.name} 读帖点赞分享失败 [${e.message}]`);
      resultMessage += `读帖点赞分享: 失败 [${e.message}]\n`;
    }
    
    resultMessage += `读帖点赞分享: 成功\n`;
    await utils.randomSleepAsync();
  }

  const END = moment().unix();
  logger.info(`运行结束, 用时 ${END - START} 秒`);
  resultMessage += `\n用时 ${END - START} 秒`;
  sendReport(resultMessage);
})();