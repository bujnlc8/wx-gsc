<?php
function upload_qcloud($key, $data)
{
    $bucket = 'text2audio';
    $cosClient = new Qcloud\Cos\Client(array(
        'region' => 'bj',
        'credentials' => array(
            'appId' => '1256650966',
            'secretId' => 'AKIDVBjR3Xnk9NOEsLAiCboskRxKXdR8e7LN',
            'secretKey' => 'zmOtrpfMrAGB1fqwujM5h7LV7g3LSSMA'
        )
    ));
    try {
        $result = $cosClient->putObject(array(
            'Bucket' => $bucket,
            'Key' => $key,
            'Body' => $data
        ));
        return $result;
    } catch (\Exception $e) {
        return null;
    }
}