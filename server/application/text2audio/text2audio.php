<?php
require(__DIR__ .'/SDK/Configer.php');
require(__DIR__ .'/SDK/API.php');
require(__DIR__ .'/SDK/HttpUtil.php');
require(__DIR__ .'/SDK/Signature.php');
require(__DIR__ .'/upload.php');
$app_id = '1106917980';
$app_key = 'iX90SNtsZZ4609sC';
Configer::setAppInfo($app_id, $app_key);

function getMillisecond() { 
    list($s1, $s2) = explode(' ', microtime()); 
    return (float)sprintf('%.0f', (floatval($s1) + floatval($s2)) * 1000); 
}

function text2audio($text) {
	$count = mb_strlen($text, 'utf-8');
	$text_split = array();
	$urls = array();
	for($index=0; $index * 50 < $count; $index++){
		$text_split[] = mb_substr(
		$text, 50 * $index, 50, 'utf-8');
	}
	for($i=0; $i< count($text_split); $i++){
		//失败率好高, 循环调用20次
			for ($index=0;$index<20;$index++) {
				$result = API::text2audio($text_split[$i]);
				if($result){
					$urls[] = upload_qcloud(getMillisecond().rand(0,10000).'.mp3', $result)->get('ObjectURL');
					break;
				}
			}
	}
	return $urls;
}