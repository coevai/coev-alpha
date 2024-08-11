import * as fs from 'fs';
import * as path from 'path';

export const gp = (folder:string,suffix?: string) => `${folder}/${suffix ?? ''}`.replace('//','/');
export class AppService {
  getFile({ name,folder }: { name: string,folder:string }): string {
    const file = fs.readFileSync(gp(folder,name)).toString();
    return file;
  }
  updateFile({ content, name, folder}: { content: string; name: string,folder:string }) {
    const filename = gp(folder,name);
    fs.mkdirSync(path.dirname(filename), {recursive: true});
    fs.writeFileSync(filename, content);
  }
  async writeCode({
    instruction,
    files,
    folder,
    prompt,
    images,
    apiKey
  }: {
    instruction: string;
    files: string[];
    folder:string;
    prompt:string;
    images?:string[];
    apiKey:string;
  }) {
    const fileMap: { [id: string]: string } = {};
    await Promise.all(files.map(async selectedFile => {
      const file = await this.getFile({folder,name:selectedFile});
      fileMap[selectedFile] = file;
    }));
    const {output_file_map,issues,res, tokens_used, tokens_remaining} = await ThinkFileEdits({file_map:fileMap,instruction,prompt,images},apiKey);
    await Promise.all(
      Object.entries(output_file_map).map(async ([name, content]) => {
        await this.updateFile({ content, name,folder });
      }),
    );
    return {res,issues,tokens_used,tokens_remaining};
  }
}

interface think {
  file_map:{[id:string]:string}
  instruction:string
  images?:string[]
  prompt:string
}

async function ThinkFileEdits(input:think,apiKey:string):Promise<{output_file_map:{[id:string]:string},issues:any[],res:any,tokens_used:number,tokens_remaining:number}>{
  // const res = await fetch('http://localhost:5174/api/think',{
  // const res = await fetch('https://www.coevai.com/api/think',{
  // const res = await fetch('http://127.0.0.1:54321/functions/v1/think',{
  const res = await fetch('https://nrosixfbwutwngmsankz.supabase.co/functions/v1/think',{
    method:'POST',
    body:JSON.stringify(input),
    headers:{
      'X-API-Key':apiKey,
      authorization:'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb3NpeGZid3V0d25nbXNhbmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI2NjY3ODAsImV4cCI6MjAzODI0Mjc4MH0.JmYcTSfb46xEO814UlrDvyoEQZOlZ7Wb1Ba9IN3qP9g'
    }
  });
  if (!res.ok) {
    const error = await res.text()
    console.error('ThinkFileEdits error',res.status,error);
    throw new Error(error);
  }
  return await res.json();
}