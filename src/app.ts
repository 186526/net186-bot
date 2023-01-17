import { Context, Telegraf, session, Scenes } from "telegraf";
import { Update } from "typegram";

import handleList from "./handler/list";
import queryInit, { queryContext } from "./handler/query";
import handleInfo from "./handler/info";

import config from "./config";
import "./polyfill";

const bot: Telegraf<Context<Update> & queryContext> = new Telegraf(
	config.token
);

bot.start(handleInfo(config.adapter));

bot.help((ctx) => {
	ctx.reply(
		`/info - show information.
/list - show devices.
/route - show BGP route.
/ping - ping command.
/traceroute - traceroute command.
`,
		{ reply_to_message_id: ctx.message?.message_id }
	);
});

bot.use(session());

const stage = new Scenes.Stage<queryContext>([
	queryInit("traceroute" as capabilities, config.adapter),
	queryInit("ping" as capabilities, config.adapter),
	queryInit("bgp_route" as capabilities, config.adapter),
]);

bot.use(stage.middleware());

bot.use((ctx, next) => {
	console.log(
		`INFO: Message from ${ctx.message?.from.id}@${ctx.message?.chat.id} in ${ctx.message?.date}`
	);
	if ((ctx.message?.date ?? 0) < ((new Date().getTime() / 1000) | 0) - 120) {
		return;
	}
	next();
});

bot.command("info", handleInfo(config.adapter));
bot.command("list", handleList(config.adapter));
bot.command("route", (ctx) => ctx.scene.enter("bgp_route"));
bot.command("ping", (ctx) => ctx.scene.enter("ping"));
bot.command("traceroute", (ctx) => ctx.scene.enter("traceroute"));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

bot.launch();

bot.catch((err, ctx) => {
	console.log(ctx, err);
	ctx.editMessageText(`${err}`);
});
