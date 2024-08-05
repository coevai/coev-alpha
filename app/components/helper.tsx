
import { Box, Button, HStack, Center, VStack, CheckboxGroup, Checkbox, Code, Textarea, Input, Image , Collapse, Spinner} from '@chakra-ui/react'
import { LoaderFunctionArgs, json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import React, { useState } from 'react';
import { FileTree } from './fileTree';



interface ToolsBetaMessageParam {
  role:'assistant',
  content:string|[{type:'tool_use',input:{}}]
}

interface fnoutput {
  edits: {
    change_summary:string;
    before_text: string;
    after_text: string;
    file_name: string;
  }[];
}

const systemMessage = `When editing code, Write a step by step plan of code changes that need to be made ( 1-3 lines), then make all necessary code changes to implement plan. 
When fixing bugs, instead think about why the bug was introduced in the first place then fix it.
Dont remove features by accident. 
Remember to import things when needed. Please write code that is absolutely perfect with no shortcuts taken and no bugs.
Don't just add logs to debug, actually fix bugs immediately.`;


let savedState:{folder:string,prompt?:string,webapp?:string,showScreenshot?:boolean,selectedFiles?:string[]};
export const Helper = () => {
  const [value, setValue] = useState('')
  let [prompt, setPrompt] = useState('')
  let [webapp, setWebapp] = useState('')
  let [showCode, setShowCode] = useState(false)
  let [showScreenshot, setShowScreenshot] = useState(false)
  let [screenshot, setScreenshot] = useState<string>()
  let [browserErrors, setBrowserErrors] = useState<string>()
  let [uploadedImage, setUploadedImage] = useState<string>()
  let [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const toggleSelectFile = (path:string) => {
    if (selectedFiles.includes(path)) selectedFiles = selectedFiles.filter(file => file != path);
    else selectedFiles.push(path);
    setSelectedFiles(selectedFiles);
    saveLocal();
  }
  let [folder, setFolder] = useState<string>();
  async function takeScreenshot(){
    setScreenshotting(true);

    const {screenshot,errors} = (await (await fetch('/look', { method: 'post', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ 
      webapp
    }) })).json());
    setScreenshot(screenshot);
    setBrowserErrors(errors);
    setScreenshotting(false);
  }
  async function OnStart(){
    if (!savedState) {
      const localState = JSON.parse(localStorage.getItem('ai-coder')??JSON.stringify({folder:'/fillthisin'}));
      folder = localState.folder;
      savedState = await (await fetch('/config/get', { method: 'post', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ 
        folder
      }) })).json();
    }
    setFolder(folder);
    prompt = savedState.prompt??'';
    setPrompt(prompt);
    webapp = savedState.webapp??'';
    setWebapp(webapp);
    if (savedState.showScreenshot) {
      showScreenshot = savedState.showScreenshot;
      setShowScreenshot(showScreenshot);
    }
    if (savedState.selectedFiles) {
      selectedFiles = savedState.selectedFiles;
      setSelectedFiles(selectedFiles);
    }
    if (webapp.length) await takeScreenshot();
  }
  React.useEffect(() => {
    OnStart();
  },[]);
  const handleChange = (event: any) => {
    setValue(event.target.value)
  }
  const saveLocal = async () => {
    localStorage.setItem('ai-coder',JSON.stringify({folder}));
    await fetch('/config/put', { method: 'post', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ 
      folder,
      content:{
        folder,
        prompt,
        webapp,
        showScreenshot,
        selectedFiles
      }
    }) });
  }
  const [history, setHistory] = useState<Array<ToolsBetaMessageParam>>([]);
  const [thinking, setThinking] = useState(false);
  const [screenshotting,setScreenshotting] = useState(false);
  const [issues,setIssues] = useState([]);
  const handleSubmit = async () => {
    try {
      setIssues([]);
      let images:string[] = [];
      if (showScreenshot && screenshot?.length) images.push(screenshot);
      if (uploadedImage?.length) images.push(uploadedImage);
      setThinking(true);
      const prompt = browserErrors ? `errors: ${browserErrors}\n` : '' + `${value}`;
      const {res,issues}:{res:Array<ToolsBetaMessageParam>,issues:[]} = await (await fetch('/think', { method: 'post', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ 
        instruction:prompt,
        files:selectedFiles.map(file => file.slice(folder?.length)),
        folder,
        prompt:systemMessage+'\n'+prompt,
        images:
        images
      }) })).json();
      // opnly show most recent for now
      setIssues(issues);
      setHistory([...res]);
    }

    catch (e) {
      console.error(e);
    } finally {
      setThinking(false);
    }
    if (webapp.length) await takeScreenshot();
  }


  return (
    <HStack className='h-screen'>
      <VStack className='bg-gray-100 p-3 border h-screen'>
        <div className='font-semibold'>&#128193; Workspace Path *</div>
        <input 
          className='bg-gray-50 w-full border p-2 text-sm'
          value={folder} placeholder='/path/to/workspace' onChange={(e) => {
          folder = e.target.value;
          setFolder(folder);
          saveLocal();
          }}/>
        <div className='font-semibold'>Select Files for AI to read / edit *</div>
        {folder && <FileTree path={folder} is_folder={true} base_path={folder} expand={true} toggleSelectedFile={toggleSelectFile} selectedFiles={selectedFiles}/>}
        <div className='font-semibold'>Show AI An Image</div>
        <Input type="file" name="file" id='file' onChange={async (e) => {
          if (!e?.target?.files) return;
          console.log(e.target.files[0]);
          let file = e.target.files[0];
          const result = await new Promise<string>(resolve => {
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              resolve(reader.result as string);
            };
          });
          console.log("File Is", file);
          setUploadedImage(result);
        }} />
        <HStack>
          <span className='font-semibold'>Collect web app errors / screenshot</span>
          <input className="g-gray-50 w-full border text-sm p-2" type='checkbox' checked={showScreenshot} onChange={(e) => {showScreenshot = true;setShowScreenshot(true);saveLocal()}} />
        </HStack>
        <input 
          className='g-gray-50 w-full border text-sm p-2'
          value={webapp} placeholder='http://localhost:8080' onChange={(e) => {
          webapp = e.target.value;
          setWebapp(webapp);
          saveLocal();
          }}/>

          <div className='font-semibold'>
            AI Project Goal

          </div>
          <textarea
            className='bg-gray-50 w-full border text-sm p-2'
            value={prompt}
            onChange={(e) => {
              prompt = e.target.value;
              setPrompt(prompt);
              saveLocal();
            }}
            rows={8}
          />

        <Checkbox className='font-semibold' isChecked={showCode} onChange={() => setShowCode(!showCode)}>Show Agents Code Edits</Checkbox>
        <div className='font-semibold'>
            Work Style
          </div>
          <Textarea size='xl' defaultValue={systemMessage} rows={2} disabled>

          </Textarea>


      </VStack>
      <Center className='w-full' >
        <VStack>

          <VStack>
            
            {uploadedImage && <>
              <div>Uploaded image:</div>
              <Image maxWidth='768px' border={'1px'} src={uploadedImage}/>
            </>}
            {screenshotting && <HStack className='text-center items-center'><div>Screenshotting {webapp}<Spinner /></div></HStack>}
            {showScreenshot && screenshot && <>
              <Image maxWidth='768px' border={'1px'} className="border-2" src={'data:image/png;base64, '+screenshot}/>
            </>}
            {
              browserErrors && <>
                <div>Errors:</div>
                <div className='bg-red-100 p-8'>{browserErrors}</div>
              </>
            }
            {issues?.length && <div className='bg-red-100'>
              AI Errors:
              {JSON.stringify(issues,null,2)}

            
            </div>}
            {history.map((h, i) => {
              let content: any = JSON.stringify(h);
              if (typeof h.content === 'string') content = h.content;
              else if (h.role === 'assistant' && Array.isArray(h.content)) {
                content = h?.content?.map((tool_call, i) => {
                  if (tool_call.type !== 'tool_use' || !showCode) return <></>
                  return <div key={i}>{(tool_call.input as fnoutput).edits.map((fn,i) => {
                  return <div key={i}>
                    <div>{fn.file_name}</div>
                    <div>{fn.change_summary}</div>
                    <div>
                      <Code whiteSpace={'pre'} textAlign={'start'}>{fn.before_text}</Code>
                    </div>
                    <Code whiteSpace={'pre'} textAlign={'start'} borderTop={"1px solid black"}>{fn.after_text}</Code>
                  </div>
                  })}</div>
                })
              }
              return <Box key={i} whiteSpace={'pre-wrap'} >
                {content}

              </Box>
            })}
          </VStack>
          <HStack alignItems={'center'} justifyContent={'center'}>
            <Textarea
            className='text-center'
              value={value}
              onChange={handleChange}
              placeholder='What should the AI do now?'
              size='xl'
              rows={5}
              width={'700px'}
            />
            <Button onClick={handleSubmit} isLoading={thinking}>Send</Button>
          </HStack>
        </VStack >
      </Center >
    </HStack>
  )
}

