<?php
	$page = 0;
	$limit = 20;
	$tags = 'order%3Ascore+rating%3Aquestionable';
	$base = 'https://konachan.com/post.json?page={page}&limit={limit}&tags={tags}';

	while($page < 1000){
		$url = str_replace('{page}', $page, $base);
		$url = str_replace('{limit}', $limit, $url);
		$url = str_replace('{tags}', $tags, $url);
		$page++;
		echo $url."\r\n";
	}
