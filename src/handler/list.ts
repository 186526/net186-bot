import { Context } from "telegraf";

export default function handleList(adapter: adapter) {
	return async (ctx: Context) => {
		const devices = await adapter.devices();
		let map: { [key: string]: device[] } = {};
		devices.forEach(
			(device) =>
				(map[device.group] =
					typeof map[device.group] == "object"
						? [...map[device.group], device]
						: [device])
		);
		await ctx.replyWithHTML(Object.keys(map).map(key => `<b>${key}</b>: \n${map[key].map(dev=>`${dev.name}`).join("\n")}`).join("\n\n"),{
			reply_to_message_id: ctx.message?.message_id
		});
	};
}
