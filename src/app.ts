import { Context, Telegraf } from 'telegraf';
import { Update } from 'typegram';
import handleInfo from './handler/info';
import config from "./config";

const bot: Telegraf<Context<Update>> = new Telegraf(config.token);

bot.start(handleInfo(config.adapter));

bot.launch();