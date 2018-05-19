<?php
require(__DIR__ .'/SDK/Configer.php');
require(__DIR__ .'/SDK/API.php');
require(__DIR__ .'/SDK/HttpUtil.php');
require(__DIR__ .'/SDK/Signature.php');
require(__DIR__ .'/upload.php');
$app_id = '1106917980';
$app_key = 'iX90SNtsZZ4609sC';
Configer::setAppInfo($app_id, $app_key);

function text2audio($text) {
	$count = mb_strlen($text, 'utf-8');
	$text_split = array();
	$urls = array();
	for($index=0; $index * 49 < $count; $index++){
		$text_split[$index] = mb_substr(
		$text, 49 * $index, 49 * ($index+1), 'utf-8');
	}
	for($i=0; $i< count($text_split); $i++){
		//失败率好高, 循环调用1000次
			for ($index=0;$index<1000;$index++) {
				$result = API::text2audio($text_split[$i]);
				if($result){
					$urls[$i] = upload_qcloud(time().'.mp3', $result)->get('ObjectURL');
					break;
				}
			}
	}
	return $urls;
}