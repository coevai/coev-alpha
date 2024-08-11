import React, { useMemo } from 'react';
import { Icon, IconButton ,Box,Checkbox} from '@chakra-ui/react'
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
        if (is_folder){
            if(selectedFiles.some(file => file.includes(path)) || expand) {
                expandFolder();
                setExpanded(true);
            }
        } else {
            if (selectedFiles.includes(path)) setExpanded(true);
        }
    },[]);
    const [files,setFiles] = React.useState<{path:string,is_folder:boolean}[]>();
    let text = path.slice(base_path.length);
    if (text.startsWith('/')) text = text.slice(1);
    const Component = expanded ? ChevronDownIcon : ChevronRightIcon;
    return (
        <Box className='text-sm'>
            <Box
                className={`p-2 rounded cursor-pointer transition-colors duration-200 ${(expanded && !is_folder) ? 'bg-blue-200 dark:bg-blue-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                onClick={() => {
                    if (is_folder) expandFolder();        
                    else toggleSelectedFile(path);
                    setExpanded(!expanded);
                }}
                display='flex'
                alignItems='center'
            >
                {is_folder && <Component mr={2} />}
                <Box flex={1}>{text}</Box>
                {!is_folder && (
                    <Checkbox
                        isChecked={expanded}
                        onChange={() => {}}
                        size='sm'
                        colorScheme='blue'
                    />
                )}
            </Box>
            <Box pl={6}>
                {expanded && files?.map(file => (
                    <FileTree
                        key={file.path}
                        {...file}
                        base_path={path}
                        toggleSelectedFile={toggleSelectedFile}
                        selectedFiles={selectedFiles}
                    />
                ))}
            </Box>
        </Box>
    );
}

