<?php
$urls = [];
foreach (getDir4('./data/') as $file) {
	$json = json_decode(file_get_contents($file), true);
	foreach ($json as $key => $value) {
		$urls[] = $value['sample_url'];
	}
}	
echo count($urls);
file_put_contents('res.json', json_encode($urls));
	
function getDir4($path) {

    if(!file_exists($path)) {
        return [];
    }
    $handel = dir($path);
    $fileItem = [];
    if($handel) {
        while(($file = $handel->read()) !== false) {
        	if(strtolower(substr($file, -5)) != '.json') continue;
            $newPath = $path . DIRECTORY_SEPARATOR . $file;
            if(is_dir($newPath) && $file != '.' && $file != '..') {

                $fileItem = array_merge($fileItem,getDir4($newPath));
            }else if(is_file($newPath)) {
                $fileItem[] = $newPath;
            }
        }
    }
    $handel->close();

    return $fileItem;
}
