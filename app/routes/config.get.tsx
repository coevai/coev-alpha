import { ActionFunctionArgs, json } from "@remix-run/node";
import { AppService } from "~/helper-backend";

export async function action({
    request,
  }: ActionFunctionArgs) {
    const {folder} = await request.json();
    const coev_service = new AppService();
    try {
      const file = coev_service.getFile({name:'.coev',folder})
      return json(JSON.parse(file??{}))
    } catch (e) {
      return json({})
    }
  }