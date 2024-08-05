import React, { useMemo } from 'react';
import { Icon, IconButton } from '@chakra-ui/react'
import { ChevronDownIcon,ChevronRightIcon,ChevronUpIcon } from '@chakra-ui/icons';
export function FileTree({path,is_folder,base_path,expand,toggleSelectedFile,selectedFiles}:{path:string,is_folder:boolean,base_path:string,expand?:boolean,toggleSelectedFile:(path:string) => any,selectedFiles:string[]}) { 
    const [expanded,setExpanded] = React.useState(expand);
    // use effect to fetch children
    const expandFolder = async () => {
        if (!files && is_folder) {
            console.log(path);
            const files = await (await fetch('/files/list', { method: 'post', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ 
                path
            }) })).json();
            setFiles(files);
        }
    }
    React.useEffect(() => {
        if(expand) expandFolder();
        if (!is_folder && selectedFiles.includes(path)) setExpanded(true);
    },[expand]);
    const [files,setFiles] = React.useState<{path:string,is_folder:boolean}[]>();
    let text = path.slice(base_path.length);
    if (text.startsWith('/')) text = text.slice(1);
    const Component = expanded ? ChevronDownIcon : ChevronRightIcon;
    return (
        <div className='text-sm'>
            
            <div 
                className={(expanded && !is_folder) ? 'bg-green-200' : ''}
                onClick={() => {
                    if (is_folder) expandFolder();        
                    else toggleSelectedFile(path);
                    setExpanded(!expanded);
                }}
            >
                {is_folder && <Component
                    
                />} {text}</div>
            <div className='pl-3'>
                {expanded && files?.map(file =><FileTree key={file.path} {...file} base_path={path} toggleSelectedFile={toggleSelectedFile} selectedFiles={selectedFiles}/>)}
            </div>
        </div>
    );
}

