import { Context } from "telegraf";

export default function handleInfo(adapter: adapter) {
    return async (ctx: Context)=>{
        const info = await adapter.info();
        await ctx.reply(`${info.name} Bot from ${info.organization}.`, {
            reply_to_message_id: ctx.message?.message_id
        })    
    }
}