<?php
require(__DIR__ .'/text2audiobaidu/AipSpeech.php');
//require(__DIR__ .'/upload.php');
const appId = '11268943';
const apiKey = '64L7hHTDWTXuKsF2cYFiD24G';
const secretKey = 'f1c5019df9e271beb3f4e31aa550923c';

function getMillisecond2() { 
    list($s1, $s2) = explode(' ', microtime()); 
    return (float)sprintf('%.0f', (floatval($s1) + floatval($s2)) * 1000); 
}

function text2audiobaidu($text) {
	$count = mb_strlen($text, 'utf-8');
	$text_split = array();
	$urls = array();
	for($index=0; $index * 341 < $count; $index++){
		$text_split[] = mb_substr(
		$text, 341 * $index, 341, 'utf-8');
	}
	for($i=0; $i< count($text_split); $i++){
			for ($index=0;$index<5;$index++) {
				$client = new AipSpeech(appId, apiKey, secretKey);
					$result = $client->synthesis($text_split[$i], 'zh', 1, array(
						'vol' => 5,
						'per'=>0,
						'spd'=>4,
					));
					if(!is_array($result)){
						$urls[] = upload_qcloud(getMillisecond2().rand(0,10000).'.mp3', $result)->get('ObjectURL');
						break;
					}
			}
	}
	return $urls;
}