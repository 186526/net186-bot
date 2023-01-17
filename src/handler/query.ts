import { Context, deunionize, Scenes, session } from "telegraf";
import Address from "../lib/address";
import type { Address4, Address6 } from "ip-address";

interface querySession extends Scenes.SceneSession {
	choosenDevice: device;
	devices: device[];
	address: Address4 | Address6;
}

export interface queryContext extends Context {
	session: querySession;

	scene: Scenes.SceneContextScene<queryContext>;
}

export default (capability: capabilities, adapter: adapter) => {
	const queryScene = new Scenes.BaseScene<queryContext>(capability);
	queryScene.enter(async (ctx) => {
		let text = deunionize(ctx.message)?.text;
		if (!text) return;
		let command = text.split(" ").filter((k) => k);

		if (command.length == 1) {
			ctx.reply(`Usage: ${text} target [Device]`);
			return;
		}

		const originMessage = await ctx.reply("Querying Looking Glass...", {
			reply_to_message_id: ctx.message?.message_id,
		});

		try {
			ctx.session.address = Address(command[1]);
		} catch (e: any) {
			await ctx.telegram.editMessageText(
				originMessage.chat.id,
				originMessage.message_id,
				undefined,
				e.toString()
			);
			return;
		}
		ctx.session.devices = await adapter.devices();

		if (command.length == 2) {
			await ctx.telegram.editMessageText(
				originMessage.chat.id,
				originMessage.message_id,
				undefined,
				"Please select the device you want to query about.",
				{
					reply_markup: {
						inline_keyboard: ctx.session.devices.reduce(
							(
								pre: {
									text: string;
									callback_data: string;
								}[][],
								cur
							) => {
								if (pre[pre.length - 1].length == 2) pre.push([]);
								pre[pre.length - 1].push({
									text: cur.name,
									callback_data: cur.name,
								});
								return pre;
							},
							[
								[
									{
										text: "Random Device",
										callback_data: "random",
									},
								],
							]
						),
					},
				}
			);
			return;
		} else if (command.length == 3) {
			ctx.session.choosenDevice =
				ctx.session.devices.find((v) =>
					v.name.toLocaleLowerCase().includes(command[2].toLocaleLowerCase())
				) ?? ctx.session.devices[0];
		}

		const result = await adapter.query(
			capability,
			ctx.session.choosenDevice,
			ctx.session.choosenDevice.vrfs[0],
			ctx.session.address
		);

		await ctx.telegram.editMessageText(
			originMessage.chat.id,
			originMessage.message_id,
			undefined,
			`Query Result from <code>${ctx.session.choosenDevice.name}</code>.\n<code>${result.output}</code>`,
			{ parse_mode: "HTML" }
		);
	});
	queryScene.action(/.+/, async (ctx) => {
		if (ctx.match[0] != "random") {
			ctx.session.choosenDevice =
				ctx.session.devices.find((v) => v.name.includes(ctx.match[0])) ??
				ctx.session.devices[0];
		} else
			ctx.session.choosenDevice =
				ctx.session.devices[(Math.random() * ctx.session.devices.length) | 0];

		const result = await adapter.query(
			capability,
			ctx.session.choosenDevice,
			ctx.session.choosenDevice.vrfs[0],
			ctx.session.address
		);

		await ctx.editMessageText(
			`Query Result from <code>${ctx.session.choosenDevice.name}</code>.\n<code>${result.output}</code>`,
			{ parse_mode: "HTML" }
		);
	});
	return queryScene;
};
