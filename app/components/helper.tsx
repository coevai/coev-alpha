
import { Box, Button, HStack, Center, VStack, CheckboxGroup, Checkbox, Code, Textarea, Input, Image, Collapse, Spinner, Tabs, TabList, TabPanels, Tab, TabPanel, useColorMode, IconButton } from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
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

const systemMessage = `When editing code, ONLY WRITE 1 BRIEF LINE DESCRIBING THE CHANGE, then go straight to making all necessary code changes to implement plan. 
When fixing bugs, instead think about why the bug was introduced in the first place then fix it.
Dont remove features by accident. 
Remember to import things when needed. Please write code that is absolutely perfect with no shortcuts taken and no bugs.
Don't just add logs to debug, actually fix bugs immediately.`;


let savedState:{folder:string,prompt?:string,webapp?:string,showScreenshot?:boolean,selectedFiles?:string[],apiKey?:string};
export const Helper = () => {
  const [value, setValue] = useState('')
  let [prompt, setPrompt] = useState('')
  let [webapp, setWebapp] = useState('')
  let [showCode, setShowCode] = useState(false)
  // let [showScreenshot, setShowScreenshot] = useState(false)
  // let [screenshot, setScreenshot] = useState<string>()
  let [uploadedImage, setUploadedImage] = useState<string>()
  let [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  let [configLoaded, setConfigLoaded] = useState(false);
  let [apiKey, setApiKey] = useState<string>('');
  const [iframeCounter,setIframeCounter] = useState(0);
  const toggleSelectFile = (path:string) => {
    if (selectedFiles.includes(path)) selectedFiles = selectedFiles.filter(file => file != path);
    else selectedFiles.push(path);
    setSelectedFiles(selectedFiles);
    saveLocal();
  }
  let [folder, setFolder] = useState<string>();
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
    if (savedState.selectedFiles) {
      savedState.selectedFiles = savedState.selectedFiles.filter(f => f.includes(folder??""));
      selectedFiles = savedState.selectedFiles;
      setSelectedFiles(selectedFiles);
    }
    if (savedState.apiKey) setApiKey(savedState.apiKey);
    setConfigLoaded(true);
  }
  function ResetIframe() {
    setIframeCounter(i => i+1);
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
        selectedFiles,
        apiKey
      }
    }) });
  }
  const [history, setHistory] = useState<Array<ToolsBetaMessageParam>>([]);
  const [thinking, setThinking] = useState(false);
  const [issues,setIssues] = useState<any[]>([]);
  const handleSubmit = async () => {
    try {
      setIssues([]);
      let images:string[] = [];
      if (uploadedImage?.length) images.push(uploadedImage);
      setThinking(true);
      const rres = await fetch('/think', { method: 'post', headers: { 'content-type': 'application/json','X-API-Key':apiKey }, body: JSON.stringify({ 
        history,
        instruction:value,
        files:selectedFiles.map(file => file.slice(folder?.length)),
        folder,
        prompt:systemMessage+'\n'+prompt,
        images:
        images
      }) });
      if (!rres.ok) {
        setIssues([rres.status,await rres.text()]);
        return;
      }
      const {res,issues,tokens_used,tokens_remaining}:{res:Array<ToolsBetaMessageParam>,issues:[],tokens_used:number,tokens_remaining:number} = await rres.json();
      // opnly show most recent for now
      setIssues(issues);
      setHistory([...history,...res]);
      console.log('tokens_used',tokens_used,'tokens_remaining',tokens_remaining);
    }

    catch (e) {
      console.error(e);
    } finally {
      setThinking(false);
    }
    if (webapp.length) await ResetIframe();
  }


  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box className={`min-h-screen ${colorMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}>
      <HStack className='min-h-screen' spacing={0}>
        <VStack className={`p-4 border-r ${colorMode === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`} width='400px' height='100vh' overflowY='auto'>
          <HStack justifyContent='space-between' width='100%'>
            <Box fontWeight='bold' fontSize='xl'>Coev AI</Box>
            <IconButton
              aria-label='Toggle dark mode'
              icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
              onClick={toggleColorMode}
              variant='ghost'
            />
          </HStack>
          <Tabs width='100%' variant='soft-rounded' colorScheme='blue'>
          <TabList>
            <Tab _selected={{ color: 'white', bg: 'blue.500' }}>Files</Tab>
            <Tab _selected={{ color: 'white', bg: 'blue.500' }}>Settings</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <VStack align='stretch' spacing={3}>
                <div className='font-semibold'>&#128193; Workspace Path *</div>
                <Input
                  value={folder}
                  placeholder='/path/to/workspace'
                  size='sm'
                  variant='filled'
                  onChange={(e) => {
                  folder = e.target.value;
                  setFolder(folder);
                  saveLocal();
                  }}/>
                <div className='font-semibold'>Select Files for AI to read / edit *</div>
                {folder && configLoaded && <FileTree path={folder} is_folder={true} base_path={folder} expand={true} toggleSelectedFile={toggleSelectFile} selectedFiles={selectedFiles}/>}

              </VStack>
            </TabPanel>
            <TabPanel>
              <VStack align='stretch' spacing={3}>
                <div className='font-semibold'>&#128193; Coev API Key * <a className="text-blue-400" href="https://www.coevai.com/download">(get here)</a></div>
                <input 
                  className='w-full border p-2 text-sm'
                  value={apiKey} placeholder='set your api key here' type='password' onChange={(e) => {
                  apiKey = e.target.value;
                  setApiKey(apiKey);
                  saveLocal();
                  }}/>
                {/* <Checkbox
                  isChecked={showScreenshot}
                  onChange={(e) => {
                    showScreenshot = e.target.checked;
                    setShowScreenshot(showScreenshot);
                    saveLocal();
                  }}
                > */}
                  <span className='font-semibold'>Show Webapp</span>
                {/* </Checkbox> */}
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
                  className='w-full border text-sm p-2'
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
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
      <Box flex={1} className='w-full p-6' overflowY='auto'>
        <VStack spacing={2} align='stretch'>
          <Box className={`p-4 rounded-lg ${colorMode === 'dark' ? 'bg-gray-700' : 'bg-white shadow-md'}`}> 
            {uploadedImage && <>
              <div>Uploaded image:</div>
              <Image maxWidth='768px' border={'1px'} src={uploadedImage}/>
            </>}
            <iframe key={iframeCounter} src={webapp} className='w-full' style={{height:'700px'}}></iframe>
            {issues?.length > 0 && <div className='bg-red-100'>
              AI Errors:
              {JSON.stringify(issues,null,2)}

            
            </div>}
            {history.map((h, i) => {
              let content: any = JSON.stringify(h);
              if (typeof h.content === 'string') {
                content = h.content;
              }
              else if (h.role === 'assistant' && Array.isArray(h.content)) {
                if (!showCode) return <></>
                content = h?.content?.map((tool_call, i) => {
                  if (tool_call.type !== 'tool_use') return <></>
                  return <div key={i}>{(tool_call.input as fnoutput)?.edits?.map((fn,i) => {
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
              return (
                <Box
                  key={i}
                  whiteSpace='pre-wrap'
                  className={`p-2 rounded-lg`}
                >
                  <Box fontWeight='bold' mb={2}>{h.role === 'assistant' ? 'AI' : 'You'}</Box>
                  {content}
                </Box>
              )
            })}
          </Box>
          <VStack alignItems='stretch' spacing={2}>
            <HStack spacing={2}>
              <div>Templates</div>
              <Button size='sm' borderRadius='full' onClick={() => setValue('Completely and cleanly implement the feature: {feature_description}')}>
                Feature
              </Button>
              <Button size='sm' borderRadius='full' onClick={() => setValue('Do a 5 whys root cause analysis of why {bug_description}, then fix it. Feel free to completely rewrite the code to fix. You keep failing to fix this.')}>
                Bug
              </Button>
            </HStack>
            <HStack alignItems='flex-start' spacing={4}>
              <Textarea
                value={value}
                onChange={handleChange}
                placeholder='What should the AI do now?'
                size='md'
                rows={5}
                resize='none'
                className={`flex-grow ${colorMode === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'}`}
              />
              <Button
                onClick={handleSubmit}
                isLoading={thinking}
                colorScheme='blue'
                size='lg'
                px={8}
              >
                Send
              </Button>
            </HStack>
          </VStack>
        </VStack >
      </Box >
    </HStack>
    </Box>
  )
}

