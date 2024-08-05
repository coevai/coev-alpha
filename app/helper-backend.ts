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
    images
  }: {
    instruction: string;
    files: string[];
    folder:string;
    prompt:string;
    images?:string[];
  }) {
    const fileMap: { [id: string]: string } = {};
    await Promise.all(files.map(async selectedFile => {
      const file = await this.getFile({folder,name:selectedFile});
      fileMap[selectedFile] = file;
    }));
    const {output_file_map,issues,res} = await ThinkFileEdits({file_map:fileMap,instruction,prompt,images});
    await Promise.all(
      Object.entries(output_file_map).map(async ([name, content]) => {
        await this.updateFile({ content, name,folder });
      }),
    );
    return {res,issues};
  }
}

interface think {
  file_map:{[id:string]:string}
  instruction:string
  images?:string[]
  prompt:string
}

async function ThinkFileEdits(input:think):Promise<{output_file_map:{[id:string]:string},issues:any[],res:any}>{
  // const res = await fetch('http://localhost:5174/api/think',{
  const res = await fetch('https://www.coevai.com/api/think',{
    method:'POST',
    body:JSON.stringify(input)
  });
  return await res.json();
}