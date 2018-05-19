<?php
require(dirname(__DIR__).'/text2audio/text2audio.php');
defined('BASEPATH') or exit('No direct script access allowed');
use \QCloud_WeApp_SDK\Mysql\Mysql as DB;

class Songci extends CI_Controller
{

    public function index()
    {   
        $id = $this->uri->segment(3);
        $open_id = $this->uri->segment(4);
        $result = [];
        if ($id && $id != 'all') {
            try {
                $id = (int) $id;
            } catch (Exception $e) {
                return $this->json([
                    'code' => 0,
                    'data' => [
                        'msg' => '参数错误',
                        'data' => null
                    ]
                ]);
            }
            $result = DB::select('gsc', [
                'id',
                'work_title',
                'work_author',
                'work_dynasty',
                'content',
                'translation',
                'intro', 'annotation_', 'foreword', 'appreciation', 'master_comment', 'layout', 'audio_id'
            ], 'id=' . $id);
        } else if ($id == 'all') {
          $num = range(1,8100);
          shuffle($num);
          $s = array();
          for ($i=0; $i < 30; $i++) {
              $s[] = $num[$i];
           }
            $s = join(',', $s);
            $result = DB::select('gsc', [
                'id',
                'work_title',
                'work_author',
                'work_dynasty',
                'content',
                'translation',
                'intro', 'annotation_', 'foreword', 'appreciation', 'master_comment', 'layout', 'audio_id'
            ], ' id in  ('.$s.')  order by audio_id desc');
        } else {
            $result = DB::select('gsc', [
                'id',
                'work_title',
                'work_author',
                'work_dynasty',
                'content',
                'translation',
                'intro', 'annotation_', 'foreword', 'appreciation', 'master_comment', 'layout', 'audio_id'
            ], 'id=1');
        }
        if ($id == 'all') {
            $arr = array();
        } else {
            $arr = null;
        }
        for ($index = 0; $index < count($result); $index ++) {
            $row = $result[$index];
            $data = array(
                'id' => $row->id,
                'work_title' => $row->work_title,
                'work_author' => $row->work_author,
                'work_dynasty' => $row->work_dynasty,
                'content' => $row->content,
                'translation' => $row->translation,
                'intro' => $row->intro,
                'foreword' => $row->foreword,
                'annotation' => $row->annotation_,
                'appreciation'=>$row->appreciation,
                'master_comment'=>$row->master_comment,
                'layout'=>$row->layout,
                'audio_id'=>$row->audio_id
            );
            if ($id == 'all') {
                $arr[] = $data;
            } else {
                $data['like'] = 0;
                //查询是否喜欢过
                if($open_id){
                    $result = DB::select('user_like_gsc', ['id'], ' open_id="'.$open_id.'" and gsc_id='.$id);
                    if($result){
                        $data['like'] = 1;
                    }
                }
                $arr = $data;
            }
        }
        $this->json([
            'code' => 0,
            'data' => [
                'msg' => 'success',
                'data' => $arr
            ]
        ]);
    }

    public function query()
    {
        $q = $this->uri->segment(3);
        $page = $this->uri->segment(4);
        $open_id = $this->uri->segment(5);
        $q = urldecode($q);
        $arr = array();
        if ($q && $q!='音频') {
            if($page=='main'){
            $result = DB::select('gsc', [
                'id',
                'work_title',
                'work_author',
                'work_dynasty',
                'content',
                'audio_id'
            ], '(work_title like "%' . $q . '%")  or ' . '(work_author like "%' . $q . '%") order by audio_id desc');
            }else{
              //只在我的喜欢里面搜索
            $my_lises = DB::select('user_like_gsc', ['gsc_id'], 'open_id="'.$open_id.'"');
             $s = array();
            for($index=0;$index<count($my_lises);$index++){
             $s[$index] = $my_lises[$index]->gsc_id;
            }
            $s = join(',', $s);
            $result = DB::select('gsc', [
                'id',
                'work_title',
                'work_author',
                'work_dynasty',
                'content',
                'audio_id'
            ], ' id in  ('.$s.')  and ((work_title like "%' . $q . '%")  or ' . '(work_author like "%' . $q . '%"))   order by audio_id desc' );
            }
        } else if(!$q) {
          $num = range(1,8100);
          shuffle($num);
          $s = array();
          for ($i=0; $i < 30; $i++) {
              $s[] = $num[$i];
           }
            $s = join(',', $s);
            $result = DB::select('gsc', [
                'id',
                'work_title',
                'work_author',
                'work_dynasty',
                'content',
                'audio_id'
            ], ' id in  ('.$s.') order by audio_id desc');
        }else{
          $result = DB::select('gsc', [
                'id',
                'work_title',
                'work_author',
                'work_dynasty',
                'content',
                'audio_id'
            ], ' audio_id > 0 order by audio_id desc');
        }
        for ($index = 0; $index < count($result); $index ++) {
            $row = $result[$index];
            $data = array(
                'id' => $row->id,
                'work_title' => $row->work_title,
                'work_author' => $row->work_author,
                'work_dynasty' => $row->work_dynasty,
                'content' => $row->content,
                'audio_id'=>$row->audio_id
            );
            $arr[] = $data;
        }
        $this->json([
            'code' => 0,
            'data' => [
                'msg' => 'success',
                'data' => $arr
            ]
        ]);
    }

    public function mylike()
    {
        $open_id = $this->uri->segment(3);
        $result = DB::select('user_like_gsc', ['gsc_id'], 'open_id="'.$open_id.'"');
        $s = array();
        for($index=0;$index<count($result);$index++){
          $s[$index] = $result[$index]->gsc_id;
        }
        if(!$result || count($result)==0){
          $this->json([
            'code' => 0,
            'data' => [
                'msg' => 'success',
                'data' => []
            ]
        ]);
        }else{
$s = join(',', $s);
        $arr = array();
            $result = DB::select('gsc', [
                'id',
                'work_title',
                'work_author',
                'work_dynasty',
                'content',
                'audio_id'
            ], ' id in  ('.$s.') order by audio_id desc');
        for ($index = 0; $index < count($result); $index ++) {
            $row = $result[$index];
            $data = array(
                'id' => $row->id,
                'work_title' => $row->work_title,
                'work_author' => $row->work_author,
                'work_dynasty' => $row->work_dynasty,
                'content' => $row->content,
                'audio_id'=>$row->audio_id
            );
            $arr[] = $data;
        }
        $this->json([
            'code' => 0,
            'data' => [
                'msg' => 'success',
                'data' => $arr
            ]
        ]);
    }
        }

    public function text2audio(){
      $id = $this->uri->segment(3);
      $result = DB::row('gsc', [
                'content'
            ], ' id ='.$id );
      $text = '';
      if($result){
        $text = $result->content;
      }
      if($text){
        $this->json([
            'code' => 0,
            'data' => [
                'msg' => 'success',
                'data' => text2audio($text)
            ]
        ]);
      }else{
        $this->json([
            'code' => -1,
            'data' => [
                'msg' => 'success',
                'data' => null
            ]
        ]);
      }
    }
}