import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { AppService } from "~/helper-backend";

export async function action({
    request,
  }: ActionFunctionArgs) {
    const coev_service = new AppService();
    const body = await request.json()
    body.apiKey = request.headers.get('X-API-Key');
    const files = await coev_service.writeCode(body as any,);
    return json(
      files
    );
  }