import { ActionFunctionArgs, json } from "@remix-run/node";

import {readdir} from 'node:fs/promises'
import {join} from 'node:path'

const walk = async (dirPath:string) => {
  const promises = await Promise.all(
  await readdir(dirPath, { withFileTypes: true }).then((entries) => entries.map((entry) => {
    const childPath = join(dirPath, entry.name)
    return {path:childPath,is_folder:entry.isDirectory()}
    // return entry.isDirectory() ? walk(childPath) : childPath
  })));
  return promises.flat(Number.POSITIVE_INFINITY);
}

export async function action({
    request,
  }: ActionFunctionArgs) {
    const {path} = await request.json();
    const files = await walk(path)
    return json(
      files
    );
  }