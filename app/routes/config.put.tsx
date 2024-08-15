import { ActionFunctionArgs, json } from "@remix-run/node";
import { AppService } from "~/helper-backend";

export async function action({
    request,
  }: ActionFunctionArgs) {
    const {folder,content} = await request.json();
    const coev_service = new AppService();
    coev_service.updateFile({name:'.coev',folder,content:JSON.stringify(content,null,2),createDirs:false})
    return json({})
  }
  