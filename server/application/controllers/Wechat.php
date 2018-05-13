<?php
define("TOKEN", "haihuiling");
defined('BASEPATH') or exit('No direct script access allowed');
use \QCloud_WeApp_SDK\Mysql\Mysql as DB;

class Wechat extends CI_Controller
{
  public function index()
	{
		$wechatObj = new wechatCallbackapiTest ();
if (!isset ($_GET ['echostr'])) {
    $wechatObj->responseMsg();
} else {
    $wechatObj->valid();
}
	}
}

class wechatCallbackapiTest
{
    // 验证签名
    public function valid()
    {
        $echoStr = $_GET ["echostr"];
        $signature = $_GET ["signature"];
        $timestamp = $_GET ["timestamp"];
        $nonce = $_GET ["nonce"];
        $token = TOKEN;
        $tmpArr = array(
            $token,
            $timestamp,
            $nonce
        );
        sort($tmpArr);
        $tmpStr = implode($tmpArr);
        $tmpStr = sha1($tmpStr);
        if ($tmpStr == $signature) {
            echo $echoStr;
            exit ();
        }
    }

    public function responseMsg()
    {
        $postStr = $GLOBALS ["HTTP_RAW_POST_DATA"];
        if (!empty ($postStr)) {
            $this->logger("R " . $postStr);
            $postObj = simplexml_load_string($postStr, 'SimpleXMLElement', LIBXML_NOCDATA);
            $RX_TYPE = trim($postObj->MsgType);

            $result = "";
            switch ($RX_TYPE) {
                case "event" :
                    $result = $this->receiveEvent($postObj);
                    break;
                case "text" :
                    if (strpos($postObj->Content, "天气")) {
                        $result = $this->receiveWeather($postObj);
                    } else if (trim($postObj->Content) == "?" || trim($postObj->Content) == "？") {
                        $result = $this->transmitText($postObj,"1.回复\"搜索\"+内容获取百度链接\n\n");
                    } else if ($this->isBeginwith($postObj->Content)) {
                        if ($this->isHasChinese($postObj->Content)) {
                            $result = $this->transmitTranslationZ2E($postObj, $this->tranFromZh2En($postObj->Content));
                        } else {
                            $result = $this->transmitTranslationE2Z($postObj, $this->tranFromEn2Zh($postObj->Content));
                        }
                    } else if ($this->pipeisousuo($postObj->Content)) {
                        $result = $this->transmitSousuo($postObj, $postObj->Content);
                    } else if (trim($postObj->Content) == "历史上的今天") {
                        $result = $this->transmitText($postObj, $this->todayOnHistory());
                    } else if ($this->isFindMusic(trim($postObj->Content))) {
                        $result = $this->findTheMusic($postObj);
                    } else {
                        $result = $this->turingRobot($postObj);
                    }
                    break;
                case "voice":
                    $result = $this->voiceMusic($postObj);
                    break;

            }
            $this->logger("T " . $result);
            echo $result;
        } else {
            echo "";
            exit ();
        }
    }

    private function receiveEvent($object)
    {
        switch ($object->Event) {
            case "subscribe" :
                $content = "感谢您关注haihuiling的微信！\n\n". "1.回复\"搜索\"+内容获取百度链接\n\n" . "2.回复任意其他内容聊天\n\n" . "6.回复\"？\"获取帮助\n";
                break;
        }
        $result = $this->transmitText($object, $content);
        return $result;
    }

    private function receiveWeather($object)
    {
        $keyword = substr_replace(trim($object->Content), "", -6);
        $ch = curl_init();
        $url = 'http://apis.baidu.com/heweather/weather/free?city=' . $keyword;
        $header = array(
            'apikey: 5c339000efff88167085cbeb67ae9f24',
        );
        // 添加apikey到header
        curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        // 执行HTTP请求
        curl_setopt($ch, CURLOPT_URL, $url);
        $res = curl_exec($ch);
        $obj = json_decode($res, true);
        //$result ="";
        if (strlen($this->transmitWeather($obj)) == 0) {
            $result = $this->turingRobot($object);
        } else {
            $result = $this->transmitText($object, $this->transmitWeather($obj));
        }
        return $result;
    }

    private function transmitText($object, $content)
    {
        if (!isset ($content) || empty ($content)) {
            return "";
        }
        $textTpl = "<xml>
            <ToUserName><![CDATA[%s]]></ToUserName>
            <FromUserName><![CDATA[%s]]></FromUserName>
            <CreateTime>%s</CreateTime>
            <MsgType><![CDATA[text]]></MsgType>
            <Content><![CDATA[%s]]></Content>
            </xml>";
        $result = sprintf($textTpl, $object->FromUserName, $object->ToUserName, time(), $content);
        return $result;
    }

    private function transmitWeather($weather)
    {
        $content = "";
        $basicInfo = $weather["HeWeather data service 3.0"][0]["basic"];
        if (sizeof($basicInfo) != 0) {
            $content .= $basicInfo["cnty"] . " " . $basicInfo["city"] . "\n";//"经度：".$basicInfo["lon"]. " 纬度：".$basicInfo["lat"]."\n";
            $content .= "更新时间:" . $basicInfo["update"]["loc"] . "\n";
            $nowInfo = $weather["HeWeather data service 3.0"][0]["now"];
            $content .= "此刻天气：" . $nowInfo['cond']['txt'] . "\n体感温度：" . $nowInfo['fl'] . "℃\n" . "相对湿度：" . $nowInfo['hum'] . "
        气压：" . $nowInfo['pres'] . "(kpa) " . "\n温度：" . $nowInfo['tmp'] . "℃\n能见度:" . $nowInfo['vis'] . "km\n" . $nowInfo['wind']['dir'] .
                $nowInfo['wind']['sc'] . "级" . "\n风速：" . $nowInfo['wind']['spd'] . "每小时\n";
            $aqi = $weather["HeWeather data service 3.0"][0]['aqi']['city'];
            if (sizeof($aqi) != 0) {
                $content .= "空气质量指数:" . $aqi['aqi'] . "\n空气质量类别:" . $aqi['qlty'] ./*" 一氧化碳1小时平均值(ug/m³):".$aqi['co']." 二氧化氮1小时平均值(ug/m³):".$aqi['no2']." 臭氧1小时平均值(ug/m³):".
            $aqi['o3']." */
                    "\nPM2.5 1小时均值(ug/m³):" . $aqi['pm25'] . "\n";
            }
            $content .= "------------------\n";
            /*" PM10 1小时平均值(ug/m³):".$aqi['pm10']." 二氧化硫1小时平均值(ug/m³):".$aqi['so2']."\n";*/
            $content .= "未来3天天气预报\n";
            $dailyinfo = $weather["HeWeather data service 3.0"][0]["daily_forecast"];
            $content .= "   " . $dailyinfo[1]['date'] . "\n" . "日出时间:" . $dailyinfo[1]['astro']['sr'] . "\n日落时间" . $dailyinfo[1]['astro']['ss'] . "\n";
            $cond = $dailyinfo[1]['cond'];
            $content .= "白天:" . $cond['txt_d'] . " \n夜间:" . $cond['txt_n'] . "\n";
            $tmp = $dailyinfo[1]['tmp'];
            $content .= "最高温度:" . $tmp['max'] . "℃\n最低温度:" . $tmp['min'] . "℃\n降水概率:" . $dailyinfo[1]['pop'] . "%" . "\n气压:" . $dailyinfo[1]['pres'] . "kpa\n------------------\n";
            $content .= " " . $dailyinfo[2]['date'] . "\n" . "日出时间:" . $dailyinfo[2]['astro']['sr'] . "\n日落时间" . $dailyinfo[2]['astro']['ss'] . "\n";
            $cond = $dailyinfo[2]['cond'];
            $content .= "白天:" . $cond['txt_d'] . "\n夜间:" . $cond['txt_n'] . "\n";
            $tmp = $dailyinfo[2]['tmp'];
            $content .= "最高温度:" . $tmp['max'] . "℃\n最低温度:" . $tmp['min'] . "℃\n降水概率:" . $dailyinfo[2]['pop'] . "%" . "\n气压:" . $dailyinfo[2]['pres'] . "kpa\n------------------\n";
            $content .= " " . $dailyinfo[3]['date'] . "\n" . "日出时间:" . $dailyinfo[3]['astro']['sr'] . "\n日落时间" . $dailyinfo[3]['astro']['ss'] . "\n";
            $cond = $dailyinfo[3]['cond'];
            $content .= "白天:" . $cond['txt_d'] . "\n夜间:" . $cond['txt_n'] . "\n";
            $tmp = $dailyinfo[3]['tmp'];
            $content .= "最高温度:" . $tmp['max'] . "℃\n最低温度:" . $tmp['min'] . "℃\n降水概率:" . $dailyinfo[0]['pop'] . "%" . "\n气压:" . $dailyinfo[3]['pres'] . "kpa";
        }
        return $content;

    }

    /**
     * little turing robot
     * @param $obj
     * @return string
     */
    private function turingRobot($obj)
    {
        $ch = curl_init();
        $url = 'http://apis.baidu.com/turing/turing/turing?key=8de12cff22ec6b24b09bc455c1a91a88&info=' . $obj->Content . '&userid=' . $obj->FromUserName;
        $header = array(
            'apikey:  5c339000efff88167085cbeb67ae9f24',
        );
        // 添加apikey到header
        curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        // 执行HTTP请求
        curl_setopt($ch, CURLOPT_URL, $url);
        $res = curl_exec($ch);

        $output = json_decode($res, true);
        $code = $output['code'];
        switch ($code) {
            case "100000":
                if (strlen(preg_replace("/\s|　/", "", $output['text'])) > 2048) {
                    $tmp = mb_substr(preg_replace("/\s|　/", "", $output['text']), 0, 681, "utf-8");
                    $tmp .= "...";
                    $result = $this->transmitText($obj, $tmp);
                } else {
                    $result = $this->transmitText($obj, preg_replace("/\s|　/", "", $output['text']));
                }
                break;
            case "200000":
                $result = $this->transmitText($obj, $output['text'] . $output['url']);
                break;
            case "302000":
                $list = $output['list'];
                $result = $this->transmitNews($obj, $list);
                break;
            case "305000":
                $list = $output['list'];
                $result = $this->transmitTrains($obj, $list);
                break;
            case "308000":
                $list = $output['list'];
                $result = $this->transmitCooking($obj, $list);
                break;
            case "40004":
                $result = $this->transmitText($obj, "您今天不能和我聊天了，明天继续把～");
                break;

        }
        return $result;
    }

    private function findTheMusic($object)
    {
        $str = trim(substr($object->Content, 6));
        if (strpos($str, '-')) {
            preg_match("/.*-/", $str, $song);
            preg_match("/-.*/", $str, $singer);
            if (sizeof($singer) != 0) {
                $music = $this->baiduMusic(substr($song[0], 0, -1), substr($singer[0], 1));
                if ($music['url'] != '' || $music['durl'] != '') {
                    return $this->transmitMusic($object, substr($song[0], 0, -1), substr($singer[0], 1), $music);
                } else {
                    return $this->transmitText($object, "sorry，没找到您要的歌曲，再试试看呗");
                }
            } else {

                $music = $this->baiduMusic(substr($song[0], 0, -1), "");
                if ($music['url'] != '' || $music['durl'] != '') {
                    return $this->transmitMusic($object, substr($song[0], 0, -1), "", $music);
                } else {
                    return $this->transmitText($object, "sorry，没找到您要的歌曲，再试试看呗");
                }
            }
        } else {
            $song = $str;
            $music = $this->baiduMusic($song, "");
            if ($music['url'] != '' || $music['durl'] != '') {
                return $this->transmitMusic($object, $song, "", $music);
            } else {
                return $this->transmitText($object, "sorry，没找到您要的歌曲，再试试看呗");
            }
        }
    }

    private function  voiceMusic($object)
    {
        $str = $this->doVoice($object);
        $music = $this->baiduMusic($str, "");
        if ($music['url'] != '' || $music['durl'] != '') {
            return $this->transmitMusic($object, $str, "", $music);
        } else {
            return $this->transmitText($object, "您要听的歌曲是 ".$str."? 请用更清晰的话再说一遍或者输入文字\"听歌\+歌名");
        }
    }

    /**
     * 从中文到英文
     */
    private function tranFromZh2En($obj)
    {
        $ch = curl_init();
        $url = 'http://apis.baidu.com/apistore/tranlateservice/dictionary?query=' . substr($obj, 1) . '&from=zh&to=en';
        $header = array(
            'apikey:5c339000efff88167085cbeb67ae9f24'
        );
        // 添加apikey到header
        curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        // 执行HTTP请求
        curl_setopt($ch, CURLOPT_URL, $url);
        $res = curl_exec($ch);
        return json_decode($res, true);
    }

    /**
     * 从英文到中文
     */
    private function tranFromEn2Zh($obj)
    {
        $ch = curl_init();
        $url = 'http://apis.baidu.com/apistore/tranlateservice/dictionary?query=' . substr($obj, 1) . '&from=en&to=zh';
        $header = array(
            'apikey:5c339000efff88167085cbeb67ae9f24'
        );
        // 添加apikey到header
        curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        // 执行HTTP请求
        curl_setopt($ch, CURLOPT_URL, $url);
        $res = curl_exec($ch);
        return json_decode($res, true);
    }

    /**
     * to judege the input include chinese
     */
    private function  isHasChinese($str)
    {
        if (preg_match("/[\x{4e00}-\x{9fa5}]+/u", substr($str, 1))) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * to judge the input start with #t
     * @param $str
     * @return bool
     */
    private function  isBeginwith($str)
    {
        if (preg_match("/#.?/", $str)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * return the content of e 2 z
     */
    private function transmitTranslationE2Z($object, $translation)
    {
        $textTpl = "<xml>
            <ToUserName><![CDATA[%s]]></ToUserName>
            <FromUserName><![CDATA[%s]]></FromUserName>
            <CreateTime>%s</CreateTime>
            <MsgType><![CDATA[text]]></MsgType>
            <Content><![CDATA[%s]]></Content>
            </xml>";
        $yinbiaoAm = "";
        $yinbiaoEm = "";
        $content = "";
        if ($translation['retData']['dict_result'] != []) {
            if ($translation['retData']['dict_result']['symbols'][0]['ph_am'] != "") {
                $yinbiaoAm = "美 [" . $translation['retData']['dict_result']['symbols'][0]['ph_am'] . "]";
            }
            if ($translation['retData']['dict_result']['symbols'][0]['ph_en']) {
                $yinbiaoEm = "\n英 [" . $translation['retData']['dict_result']['symbols'][0]['ph_en'] . "]\n";
            }
            $parts = $translation['retData']['dict_result']['symbols'][0]['parts'];
            $content1 = "";
            foreach ($parts as $item) {
                $content1 .= $item['part'] . "  " . $item['means'][0] . ";\n";
            }
            $content = $yinbiaoAm . $yinbiaoEm . $content1;
        } else {
            $content = "sorry，we cannot find the result you want./::'(";
        }
        $result = sprintf($textTpl, $object->FromUserName, $object->ToUserName, time(), $content);
        return $result;
    }

    /**
     * return the content of z 2 e
     */
    private function transmitTranslationZ2E($object, $translation)
    {
        $textTpl = "<xml>
            <ToUserName><![CDATA[%s]]></ToUserName>
            <FromUserName><![CDATA[%s]]></FromUserName>
            <CreateTime>%s</CreateTime>
            <MsgType><![CDATA[text]]></MsgType>
            <Content><![CDATA[%s]]></Content>
            </xml>";
        $pinyin = "";
        $content = "";
        if ($translation['retData']['dict_result'] != []) {
            if ($translation['retData']['dict_result']['symbols'][0]['ph_zh'] != "") {
                $pinyin = "pinyin [" . $translation['retData']['dict_result']['symbols'][0]['ph_zh'] . "]\n";
            }
            $parts = $translation['retData']['dict_result']['symbols'][0]['parts'];
            $content1 = "means: ";
            foreach ($parts as $item) {
                $content1 .= $item['means'][0] . ";\n";
            }
            $content = $pinyin . $content1;
        } else {
            $content = "对不起，我们未能找到您想要的结果/::'(";
        }
        $result = sprintf($textTpl, $object->FromUserName, $object->ToUserName, time(), $content);
        return $result;
    }

    private function  pipeisousuo($str)
    {
        if (preg_match("/^搜索/", $str)) {
            return true;
        } else {
            return false;
        }

    }

    private function transmitSousuo($object, $str)
    {
        $sou = "<a href=\"https://www.baidu.com/s?wd=";
        $content = "您要的搜索结果链接：" . $sou . substr($str, 6) . "\">" . " 点我进入 </a>";
        $textTpl = "<xml>
            <ToUserName><![CDATA[%s]]></ToUserName>
            <FromUserName><![CDATA[%s]]></FromUserName>
            <CreateTime>%s</CreateTime>
            <MsgType><![CDATA[text]]></MsgType>
            <Content><![CDATA[%s]]></Content>
            </xml>";
        $result = sprintf($textTpl, $object->FromUserName, $object->ToUserName, time(), $content);
        return $result;
    }

    /**transmit news
     * @param $object
     * @param $newsArray
     * @return string
     */
    private function transmitNews($object, $newsArray)
    {
        if (!is_array($newsArray)) {
            return "";
        }
        $itemTpl = "    <item>
        <Title><![CDATA[%s]]></Title>
        <Description><![CDATA[%s]]></Description>
        <PicUrl><![CDATA[%s]]></PicUrl>
        <Url><![CDATA[%s]]></Url>
    </item>
";
        $item_str = "";
        if (sizeof($newsArray) <= 10) {
            foreach ($newsArray as $item) {

                $item_str .= sprintf($itemTpl, $item['article'], $item['source'], $item['icon'], $item['detailurl']);

            }
        } else {
            for ($index = 0; $index < 10; $index++) {
                $item = $newsArray[$index];
                $item_str .= sprintf($itemTpl, $item['article'], $item['source'], $item['icon'], $item['detailurl']);
            }
        }
        $newsTpl = "<xml>
<ToUserName><![CDATA[%s]]></ToUserName>
<FromUserName><![CDATA[%s]]></FromUserName>
<CreateTime>%s</CreateTime>
<MsgType><![CDATA[news]]></MsgType>
<ArticleCount>%s</ArticleCount>
<Articles>
$item_str</Articles>
</xml>";

        $result = sprintf($newsTpl, $object->FromUserName, $object->ToUserName, time(), count($newsArray) > 10 ? 10 : count($newsArray));
        return $result;
    }

    /**trainsmit info of trains
     * @param $object
     * @param $newsArray
     * @return string
     */
    private function transmitTrains($object, $newsArray)
    {
        if (!is_array($newsArray)) {
            return "";
        }
        $itemTpl = "    <item>
        <Title><![CDATA[%s]]></Title>
        <Description><![CDATA[]]></Description>
        <PicUrl><![CDATA[%s]]></PicUrl>
        <Url><![CDATA[%s]]></Url>
    </item>
";
        $item_str = "";
        if (sizeof($newsArray) <= 10) {
            foreach ($newsArray as $item) {
                $item_str .= sprintf($itemTpl, "车次:" . $item['trainnum'] . "\n" . $item['start'] . "-" . $item['terminal'] . "\n" . $item['starttime'] . "-" . $item['endtime'] . "\n", $item['icon'], "http://train.qunar.com/stationToStation.htm?fromStation=" . $item['start'] . "&toStation=" . $item['terminal']);
            }
        } else {
            for ($index = 0; $index < 10; $index++) {
                $item = $newsArray[$index];
                $item_str .= sprintf($itemTpl, "车次 " . $item['trainnum'] . "\n" . $item['start'] . "-" . $item['terminal'] . "\n" . $item['starttime'] . "-" . $item['endtime'] . "\n", $item['icon'], "http://train.qunar.com/stationToStation.htm?fromStation=" . $item['start'] . "&toStation=" . $item['terminal']);

            }

        }
        $newsTpl = "<xml>
<ToUserName><![CDATA[%s]]></ToUserName>
<FromUserName><![CDATA[%s]]></FromUserName>
<CreateTime>%s</CreateTime>
<MsgType><![CDATA[news]]></MsgType>
<ArticleCount>%s</ArticleCount>
<Articles>
$item_str</Articles>
</xml>";

        $result = sprintf($newsTpl, $object->FromUserName, $object->ToUserName, time(), count($newsArray) > 10 ? 10 : count($newsArray));
        return $result;
    }

    /**trainsmit info of trains
     * @param $object
     * @param $newsArray
     * @return string
     */
    private function transmitCooking($object, $cookingArray)
    {
        if (!is_array($cookingArray)) {
            return "";
        }
        $itemTpl = "    <item>
        <Title><![CDATA[%s]]></Title>
        <Description><![CDATA[%s]]></Description>
        <PicUrl><![CDATA[%s]]></PicUrl>
        <Url><![CDATA[%s]]></Url>
    </item>
";
        $item_str = "";
        if (sizeof($cookingArray) <= 10) {
            foreach ($cookingArray as $item) {
                $item_str .= sprintf($itemTpl, $item['name'], $item['info'], $item['icon'], $item['detailurl']);
            }
        } else {
            for ($index = 0; $index < 10; $index++) {
                $item = $cookingArray[$index];
                $item_str .= sprintf($itemTpl, $item['name'], $item['info'], $item['icon'], $item['detailurl']);
            }
        }
        $newsTpl = "<xml>
<ToUserName><![CDATA[%s]]></ToUserName>
<FromUserName><![CDATA[%s]]></FromUserName>
<CreateTime>%s</CreateTime>
<MsgType><![CDATA[news]]></MsgType>
<ArticleCount>%s</ArticleCount>
<Articles>
$item_str</Articles>
</xml>";

        $result = sprintf($newsTpl, $object->FromUserName, $object->ToUserName, time(), count($cookingArray) > 10 ? 10 : count($cookingArray));
        return $result;
    }


    private function transmitMusic($object, $song, $singer, $music)
    {
        $itemTpl = "  <Music>
        <Title><![CDATA[%s]]></Title>
      <Description><![CDATA[%s]]></Description>
      <MusicUrl><![CDATA[%s]]></MusicUrl>
      <HQMusicUrl><![CDATA[%s]]></HQMusicUrl>
    </Music>
";
        $item_str = "";
        if ($music != "") {
            $item_str .= sprintf($itemTpl, $song, $singer, $music['url'], $music['durl']);
        }
        $newsTpl = "<xml>
      <ToUserName><![CDATA[%s]]></ToUserName>
      <FromUserName><![CDATA[%s]]></FromUserName>
      <CreateTime>%s</CreateTime>
      <MsgType><![CDATA[music]]></MsgType>
       $item_str
      </xml>";

        $result = sprintf($newsTpl, $object->FromUserName, $object->ToUserName, time());
        return $result;
    }

    /**
     * to judge if you want to find music
     * @param $input
     * @return bool
     *
     */
    private function isFindMusic($input)
    {
        if (preg_match('/^听歌.*/', $input) == 1) {
            return true;
        }
        return false;
    }

    /*
    * 所属类：apiFunction
    * 函数名：baiduMusic()
    * 参数：
    * 功能：调用百度音乐api，推送音乐
    */
    public function baiduMusic($Song, $Singer)
    {
        if (!empty($Song)) {
            //音乐链接有两中品质，普通品质和高品质
            $music = array(
                'url' => "",
                'durl' => "");

            //采用php函数file_get_contents来读取链接内容
            $file = file_get_contents("http://box.zhangmen.baidu"
                . ".com/x?op=12&count=1&title=" . urlencode($Song) . "$$" . urlencode($Singer) . "$$$$");

            //simplexml_load_string() 函数把 XML 字符串载入对象中
            $xml = simplexml_load_string($file,
                'SimpleXMLElement', LIBXML_NOCDATA);

            //如果count大于0,表示找到歌曲
            if ($xml->count > 0) {
                //普通品质音乐
                $encode_str = $xml->url->encode;

                //使用正则表达式，进行字符串匹配，处理网址
                preg_match("/http:\/\/([\w+\.]+)(\/(\w+\/)+)/", $encode_str, $matches);

                //第一个匹配的就是我们需要的字符串
                $url_parse = $matches[0];

                $decode_str = $xml->url->decode;

                //分离字符串，截去mid
                $decode_arr = explode('&', $decode_str);

                //拼接字符串,获得普通品质音乐
                $musicUrl = $url_parse . $decode_arr[0];


                //高品质音乐
                $encode_dstr = $xml->durl->encode;
                preg_match("/http:\/\/([\w+\.]+)(\/(\w+\/)+)/", $encode_dstr, $matches_d);

                //第一个匹配的就是我们需要的字符串
                $durl_parse = $matches_d[0];

                $decode_dstr = $xml->durl->decode;
                //分离字符串，截去mid
                $decode_darr = explode('&', $decode_dstr);

                //拼接字符串,获得高品质音乐
                $musicDurl = $durl_parse . $decode_darr[0];

                //将两个链接放入数组中
                $music = array(
                    'url' => $musicUrl,
                    'durl' => $musicDurl
                );
                return $music;

            }

            return $music;
        } else {
            $music = "";
            return $music;
        }

    }

    private function todayOnHistory()
    {
        $content = file_get_contents("http://www.todayonhistory.com");
        preg_match_all("/<a href=\"\/news.*/i", $content, $matches);
        $res = "";
        $num = 1;
        for ($index = 0; $index < 18; $index++) {
            $items = $matches[0][$index];
            $url = substr_replace($items, "", -5);
            $url1 = preg_replace("/href=\"/", "href=\"http://www.todayonhistory.com", $url);
            $url2 = preg_replace("/title.*\"/", "", $url1);
            $url3 = preg_replace("/&nbsp;&nbsp;/", "", $url2);
            $res .= $num++ . "." . $url3 . "\n\n";
        }
        return $res;
    }

    private function doVoice($object)
    {
        $str = $object->Recognition;
        preg_match("/[\x{4e00}-\x{9fa5} a-z A-Z 0-9 -]*/u", $str, $matchs);
        if (sizeof($matchs) != 0) {
            $voice = $matchs[0];
        }
        return trim($voice);
    }

    private function  getUserInfoByOpenId($openId)
    {
        $access_token = $this->getAccessToken();
        $url = "https://api.weixin.qq.com/cgi-bin/user/info?access_token=" . $access_token . "&openid=" . $openId;
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $output = curl_exec($ch);
        curl_close($ch);
        $jsoninfo = json_decode($output, true);
        return $jsoninfo;

    }

    private function getAccessToken()
    {
        $appid = "wxf36d56eb2820cdb7";
        $appsecret = "e7f0fbfd7aa3483df6b552bd7e7489f1";
        $url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=$appid&secret=$appsecret";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $output = curl_exec($ch);
        curl_close($ch);
        $jsoninfo = json_decode($output, true);
        $access_token = $jsoninfo["access_token"];
        return $access_token;
    }

    private function insertUserInfo($openId)
    {
        $json = $this->getUserInfoByOpenId($openId);
        $openid = $json['openid'];
        $nickname = $json['nickname'];
        $sex = $json['sex'];
        $city =$json['city'];
        $country = $json['country'];
        $province = $json['province'];
        $language = $json['language'];
        $headimgurl = $json['headimgurl'];
        $subscribe_time = $json['subscribe_time'];
        $unionid = $json['unionid'];
        return $openid.$nickname.$sex.$city.$country.$province.$language;
       //$this->insertUserData($openid,$nickname,$sex,$city,$country,$province,$language,$headimgurl,$subscribe_time,$unionid);

    }
    /**
     * get the connetion to mysql
     * @return mixed
     */
    public function getdbConnection()
    {
        $username = 'r29foz27ihe24c3g';
        $userpass = '198915o';
        $dbhost = 'rds2y7s8tzajr6y3d5b7.mysql.rds.aliyuncs.com';
        $dbdatabase = 'r29foz27ihe24c3g';
        $db = new mysqli($dbhost, $username, $userpass, $dbdatabase);
        if (mysqli_connect_error()) {
            echo 'Could not connect to database.';
            exit;
        }
        return $db;
    }
    public function insertUserData($open_id,$nickname,$sex,$city,$county,$province,$langu,$headimagurl,$subscrible_time,$unionid){
        $db =$this->getdbConnection();
        //$sql2 ="select * from user_info WHERE open_id ='".$open_id."'";
       // $result = $db->query($sql2);
       // if($result->num_rows==0) {
            $sql = "insert into user_info(open_id) values('".$open_id."')";
            if ($db->query($sql)) {
                error_log("保存成功");
            } else {
                echo "保存失败！";
            }
      //  }
    }

    private
    function logger($log_content)
    {
        error_log($log_content, 1, "75124771@qq.com");
        error_log($log_content, 3, "/var/log/wechat/request.log");
    }
}

?>
