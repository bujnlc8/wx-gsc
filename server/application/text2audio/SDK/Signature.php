<?php

class Signature
{
    // getReqSign ：根据 接口请求参数 和 应用密钥 计算 请求签名
    // 参数说明
    //   - $params：接口请求参数（特别注意：不同的接口，参数对一般不一样，请以具体接口要求为准）
    // 返回数据
    //   - 签名结果
    public static function getReqSign(&$params)
    {
        // 0. 补全基本参数
        $params['app_id'] = Configer::getAppId();

        if (!$params['nonce_str'])
        {
            $params['nonce_str'] = uniqid("{$params['app_id']}_");
        }

        if (!$params['time_stamp'])
        {
            $params['time_stamp'] = time();
        }
        // 1. 字典升序排序
        ksort($params);

        // 2. 拼按URL键值对
        $str = '';
        foreach ($params as $key => $value)
        {
            if ($value !== '')
            {
                $str .= $key . '=' . urlencode($value) . '&';
            }
        }
        // 3. 拼接app_key
        $str .= 'app_key=' . Configer::getAppKey();

        // 4. MD5运算+转换大写，得到请求签名
        $sign = strtoupper(md5($str));
        return $sign;
    }
}


