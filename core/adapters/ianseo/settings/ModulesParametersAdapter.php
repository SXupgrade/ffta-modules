<?php
require_once(__DIR__ . '/../database/query.php');

/**
 * Settings adapter backed by Ianseo ModulesParameters.
 *
 * TODO for agent:
 * - Verify exact table columns in Ianseo sources.
 * - Scope settings safely if Ianseo supports tournament/module scoping.
 * - Use proper escaping/helper functions from Ianseo.
 */
class ModulesParametersAdapter {
    private $moduleName = 'ffta-modules';

    public function get($key) {
        $safeKey = addslashes($key);
        $safeModule = addslashes($this->moduleName);
        $sql = "SELECT MpValue FROM ModulesParameters WHERE MpModule='{$safeModule}' AND MpParameter='{$safeKey}' LIMIT 1";
        $result = ffta_db_query($sql);
        $row = $result ? safe_fetch($result) : null;
        return $row ? $row->MpValue : null;
    }

    public function set($key, $value) {
        $safeKey = addslashes($key);
        $safeValue = addslashes(json_encode($value));
        $safeModule = addslashes($this->moduleName);
        $sql = "REPLACE INTO ModulesParameters (MpModule, MpParameter, MpValue) VALUES ('{$safeModule}', '{$safeKey}', '{$safeValue}')";
        ffta_db_query($sql);
        return true;
    }
}
