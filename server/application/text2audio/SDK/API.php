<?php
class API
{
	const CHUNK_SIZE = 6400;

    // _is_base64 ：判断一个字符串是否经过base64
    // 参数说明
    //   - $str：待判断的字符串
    // 返回数据
    //   - 该字符串是否经过base64（true/false）
	private static function _is_base64($str)
	{
	    return $str == base64_encode(base64_decode($str)) ? true : false;
	}

    // texttrans ：调用文本翻译（AI Lab）接口
    // 参数说明
    //   - $params：type-翻译类型；text-待翻译文本。（详见http://ai.qq.com/doc/nlptrans.shtml）
    // 返回数据
    //   - $response: ret-返回码；msg-返回信息；data-返回数据（调用成功时返回）；http_code-Http状态码（Http请求失败时返回）
	public static function texttrans($params)
	{
		$params['sign'] = Signature::getReqSign($params);
		$url = Configer::API_URL_PATH . '/nlp/nlp_texttrans';
		$response = HttpUtil::doHttpPost($url, $params);
		return $response;
	}

    // generalocr ：调用通用OCR识别接口
    // 参数说明
    //   - $params：image-待识别图片。（详见http://ai.qq.com/doc/ocrgeneralocr.shtml）
    // 返回数据
    //   - $response: ret-返回码；msg-返回信息；data-返回数据（调用成功时返回）；http_code-Http状态码（Http请求失败时返回）
	public static function generalocr($params)
	{
		if (!self::_is_base64($params['image']))
		{
		    $params['image'] = base64_encode($params['image']);
		}
		$params['sign'] = Signature::getReqSign($params);
		$url = Configer::API_URL_PATH . '/ocr/ocr_generalocr';
		$response = HttpUtil::doHttpPost($url, $params);
		return $response;
	}

    // wxasrs ：调用语音识别-流式版(WeChat AI)接口
    // 参数说明
    //   - $params：speech-待识别的整段语音，不需分片；
    //              format-语音格式；
    //              rate-音频采样率编码；
    //              bits-音频采样位数；
    //              speech_id-语音ID。（详见http://ai.qq.com/doc/aaiasr.shtml）
    // 返回数据
    //   - $response: ret-返回码；msg-返回信息；data-返回数据（调用成功时返回）；http_code-Http状态码（Http请求失败时返回）
	public static function wxasrs($params)
	{
		$speech = self::_is_base64($params['speech']) ? base64_decode($params['speech']) : $params['speech'];
		unset($params['speech']);
		$speech_len = strlen($speech);
		$total_chunk = floor($speech_len / self::CHUNK_SIZE);
        $params['cont_res'] = 0;
		for($i = 0; $i < $total_chunk; ++$i)
		{
			$chunk_data = substr($speech, $i * self::CHUNK_SIZE, self::CHUNK_SIZE);
			$params['speech_chunk'] = base64_encode($chunk_data);
			$params['len']          = strlen($chunk_data);
		    $params['seq']          = $i * self::CHUNK_SIZE;
		    $params['end']          = ($i == ($total_chunk-1)) ? 1 : 0;
			$response = self::wxasrs_perchunk($params);
		}
		return $response;
	}

    // wxasrs_perchunk ：调用语音识别-流式版(WeChat AI)接口
    // 参数说明
    //   - $params：speech_chunk-待识别的语音分片；
    //              seq-语音分片所在语音流的偏移量；
    //              len-分片长度；
    //              end-是否结束分片；
    //              cont_res-是否获取中间识别结果；
    //              format-语音格式；
    //              rate-音频采样率编码；
    //              bits-音频采样位数；
    //              speech_id-语音ID。（详见http://ai.qq.com/doc/aaiasr.shtml）
    // 返回数据
    //   - $response: ret-返回码；msg-返回信息；data-返回数据（调用成功时返回）；http_code-Http状态码（Http请求失败时返回）
	public static function wxasrs_perchunk($params)
	{
		if (!self::_is_base64($params['speech_chunk']))
		{
		    $params['speech_chunk'] = base64_encode($params['speech_chunk']);
		}
		$params['sign'] = Signature::getReqSign($params);
		$url = Configer::API_URL_PATH . '/aai/aai_wxasrs';
		$response = HttpUtil::doHttpPost($url, $params);
		return $response;
	}
	
	public static function text2audio($text){
		$url = 'https://api.ai.qq.com/fcgi-bin/aai/aai_tts';
		$params = array(
			'app_id'     =>  Configer::getAppId(),
			'speaker'    => '6',
			'format'     => '3',//mp3格式
			'volume'     => '0',
			'speed'      => '95',
			'text'       => $text,
			'aht'        => '0',
			'apc'        => '58',
			'time_stamp' => strval(time()),
			'nonce_str'  => strval(rand()),
			'sign'       => ''
		);
		$params['sign'] = Signature::getReqSign($params, Configer::getAppKey());
		$response = HttpUtil::doHttpPost($url, $params);
		$res_arr=json_decode($response, true);
		$ret=array(
			'ret'=>$res_arr['ret'],
			'data'=>$res_arr['msg']
		);
		if($res_arr['ret']===0){
			return base64_decode($res_arr['data']['speech']);
		}else{
			return null;
		}
	}
}