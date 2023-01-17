import { Context } from "telegraf";
import { adapter } from "../types/adapter";

export default function handleInfo(adapter: adapter) {
    return async (ctx: Context)=>{
        const info = await adapter.info();
        ctx.reply(`${info.name} Bot from ${info.organization}.`)    
    }
}