<?php
	$page = 0;
	$limit = 20;
	$tags = 'uncensored';
	$base = 'https://konachan.com/post.json?page={page}&limit={limit}&tags={tags}';
	$ch = curl_init();
	$options =  array(
		CURLOPT_HEADER => false,
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_FOLLOWLOCATION => true,
		CURLOPT_REFERER => 'https://www.google.com/',
		CURLOPT_TIMEOUT => 30,
		CURLOPT_PROXY => "127.0.0.1",
		CURLOPT_PROXYPORT => 1080,
		CURLOPT_PROXYAUTH => CURLAUTH_BASIC,
    	CURLOPT_HTTPHEADER => array('X-FORWARDED-FOR:'.Rand_IP(), 'CLIENT-IP:'.Rand_IP()),
		CURLOPT_SSL_VERIFYPEER => false,
		CURLOPT_SSL_VERIFYHOST => false,
		CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36 Edg/81.0.416.58'
	);
		
	curl_setopt_array($ch, $options);
	

	while($page < 387){
		$url = str_replace('{page}', $page, $base);
		$url = str_replace('{limit}', $limit, $url);
		$url = str_replace('{tags}', $tags, $url);
		$file = './data/'.base64_encode($url).'.json';
		var_dump($url);

		curl_setopt($ch, CURLOPT_URL, $url);
		$exists = file_exists($file);
		$content = $exists ? file_get_contents($file) : curl_exec($ch);
		//var_dump($content);
		if(!$exists){
			if(curl_getinfo($ch,CURLINFO_HTTP_CODE) == 200){
				@mkdir('./data/');
				file_put_contents($file, $content);
			}
		}
		$page++;
	}
	curl_close($ch);


function Rand_IP(){
	srand(microtime(true));
    return round(rand(600000, 2550000) / 10000).".".round(rand(600000, 2550000) / 10000).".".round(rand(600000, 2550000) / 10000).".".round(rand(600000, 2550000) / 10000);
}


