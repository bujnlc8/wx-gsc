<?php
defined('BASEPATH') OR exit('No direct script access allowed');

use \QCloud_WeApp_SDK\Auth\LoginService as LoginService;
use \QCloud_WeApp_SDK\Auth\AuthAPI as authService;
use QCloud_WeApp_SDK\Constants as Constants;
use \QCloud_WeApp_SDK\Conf as Conf;
use \QCloud_WeApp_SDK\Helper\Request as Request;
use \QCloud_WeApp_SDK\Mysql\Mysql as DB;


class User extends CI_Controller {
    public function index() {
        $result = LoginService::check();

        if ($result['loginState'] === Constants::S_AUTH) {
            $this->json([
                'code' => 0,
                'data' => $result['userinfo']
            ]);
        } else {
            $this->json([
                'code' => -1,
                'data' => []
            ]);
        }
    }
    public function auth() {
        $code = $this->uri->segment(3);
        $appId = Conf::getAppId();
        $appSecret = Conf::getAppSecret();
        $requestParams = [
            'appid' => $appId,
            'secret' => $appSecret,
            'js_code' => $code,
            'grant_type' => 'authorization_code'
        ];
        list($status, $body) = array_values(Request::get([
            'url' => 'https://api.weixin.qq.com/sns/jscode2session?' . http_build_query($requestParams),
            'timeout' => Conf::getNetworkTimeout()
        ]));
        if ($status !== 200 || !$body) {
          $this->json([
                'code' => -1,
                'data' => null]);
        }
        $this->json([
                'code' => 0,
                'data' => $body]);
    }
    public function like(){
        $open_id = $this->uri->segment(3);
        $id = $this->uri->segment(4);
        if(!$open_id || !$id){
          $this->json([
                'code' => -1,
                'data' => '参数错误']);
        }
        $result = DB::select('user_like_gsc', ['id'], ' open_id="'.$open_id.'" and gsc_id='.$id);
        if(count($result)>0){
          $this->json([
                'code' => 0,
                'data' => '已经收藏']);

        }else{
$row = DB::insert('user_like_gsc', array('open_id'=>$open_id, 'gsc_id'=>$id));
        if($row>0){
           $this->json([
                'code' => 0,
                'data' => '收藏成功']);
        }else{
           $this->json([
                'code' => -1,
                'data' => '收藏失败']);
        }
        }
    }
    public function dislike(){
        $open_id = $this->uri->segment(3);
        $id = $this->uri->segment(4);
        if(!$open_id || !$id){
          $this->json([
                'code' => -1,
                'data' => '参数错误']);
        }
        $result = DB::delete('user_like_gsc',' open_id="'.$open_id.'" and gsc_id='.$id);
        if($result>0){
          $this->json([
                'code' => 0,
                'data' => '取消成功']);

        }else{
           $this->json([
                'code' => -1,
                'data' => '取消失败']);
        }
    }
}