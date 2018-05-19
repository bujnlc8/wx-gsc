<?php

class Configer
{
	const API_URL_PATH = 'https://api.ai.qq.com/fcgi-bin/';

	private static $_app_id;
	private static $_app_key;
	private static $_err_msg;

    // setAppInfo ：设置AppID和AppKey
    // 参数说明
    //   - $app_id
    //   - $app_key
    // 返回数据
    //   - 是否设置成功
	public static function setAppInfo($app_id, $app_key)
	{
		if (!is_numeric($app_id) || $app_id <= 0)
		{
			self::$_err_msg = "invalid app_id:[{$app_id}]";
			return false;
		}
		self::$_app_id  = $app_id;
		self::$_app_key = $app_key;
		return true;
	}

	public static function getErrMsg()
	{
		return self::$_err_msg;
	}

	public static function getAppId()
	{
		return self::$_app_id;
	}

		public static function getAppKey()
	{
		return self::$_app_key;
	}
}