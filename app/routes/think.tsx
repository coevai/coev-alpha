import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { AppService } from "~/helper-backend";

export async function action({
    request,
  }: ActionFunctionArgs) {
    const coev_service = new AppService();
    const body = await request.json()
    const files = await coev_service.writeCode(body as any);
    return json(
      files
    );
  }