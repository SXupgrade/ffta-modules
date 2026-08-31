<?php

/**
 * Builds the $RET envelope in the exact shape ianseo.net's own
 * Upload-Competition.php expects -- same fields, same order of
 * construction as Ianseo core's Tournament/UploadResults-upload.php:60-90,
 * since the whole payload is gzcompress(serialize($RET)): a byte-exact
 * PHP object graph, not a loosely-parsed format the far end can adapt to.
 */
final class PublishEnvelope {
    public static function create($credentials, $onlineEventCode, $isRunArchery) {
        $ret = new \StdClass();
        $ret->ORIS = false; // ORIS (World Archery) formatting -- not offered in v1, see README.
        $ret->OnlineId = $credentials->OnlineId;
        $ret->OnlineAuth = $credentials->OnlineAuth;
        $ret->OnlineEventCode = $onlineEventCode;
        $ret->lastUpload = date('Y-m-d H:i:s');
        $ret->UUID = uniqid('Ianseo-', true);
        $ret->ProgVersion = defined('ProgramVersion') ? ProgramVersion : '';
        $ret->ProgRelease = defined('ProgramRelease') ? ProgramRelease : '';
        $ret->ProgBuild = defined('ProgramBuild') ? ProgramBuild : '';
        $ret->IsRunArchery = (bool)$isRunArchery;
        $ret->PDF = array();
        $ret->FilRemove = array();
        $ret->FilRename = array();
        $ret->URL = array();
        $ret->UrlRemove = array();
        $ret->UrlRename = array();
        $ret->BOOK = false;
        return $ret;
    }

    public static function serialize($ret) {
        return gzcompress(serialize($ret));
    }
}
