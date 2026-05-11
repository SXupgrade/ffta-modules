<?php
require_once(__DIR__ . '/../database/query.php');

/**
 * Read/write module settings through Ianseo's ModulesParameters table.
 *
 * Schema (TODO(ianseo-verified): confirm column names against your version):
 *   ModulesParameters (
 *     MpModule     VARCHAR  -- module identifier, e.g. "ffta-modules"
 *     MpParameter  VARCHAR  -- setting key
 *     MpValue      TEXT     -- JSON-encoded value
 *   )
 *
 * Values are JSON-encoded on write and decoded on read so that arrays,
 * objects, numbers and booleans survive the round-trip.
 */
class ModulesParametersAdapter {

    /** @var string */
    private $moduleName;

    public function __construct($moduleName = 'ffta-modules') {
        $this->moduleName = $moduleName;
    }

    /**
     * Read one setting value.
     *
     * @param  string $key
     * @return mixed|null  decoded value, or null when not found
     */
    public function get($key) {
        $safeModule = ffta_escape($this->moduleName);
        $safeKey    = ffta_escape($key);
        $sql    = "SELECT MpValue FROM ModulesParameters"
                . " WHERE MpModule='{$safeModule}' AND MpParameter='{$safeKey}'"
                . " LIMIT 1";
        $row = ffta_fetch_one(ffta_query($sql));
        if ($row === null || !isset($row->MpValue)) {
            return null;
        }
        $decoded = json_decode($row->MpValue, true);
        return ($decoded === null && json_last_error() !== JSON_ERROR_NONE)
            ? $row->MpValue   // stored as raw string (legacy)
            : $decoded;
    }

    /**
     * Write one setting value (upsert).
     *
     * @param  string $key
     * @param  mixed  $value  will be JSON-encoded
     * @return bool
     */
    public function set($key, $value) {
        $safeModule = ffta_escape($this->moduleName);
        $safeKey    = ffta_escape($key);
        $safeValue  = ffta_escape(json_encode($value, JSON_UNESCAPED_UNICODE));
        $sql = "REPLACE INTO ModulesParameters (MpModule, MpParameter, MpValue)"
             . " VALUES ('{$safeModule}', '{$safeKey}', '{$safeValue}')";
        ffta_write($sql);
        return true;
    }

    /**
     * Read all settings for this module.
     *
     * @return array  associative [key => decoded value]
     */
    public function getAll() {
        $safeModule = ffta_escape($this->moduleName);
        $sql  = "SELECT MpParameter, MpValue FROM ModulesParameters"
              . " WHERE MpModule='{$safeModule}'";
        $rows = ffta_fetch_all(ffta_query($sql));
        $out  = array();
        foreach ($rows as $row) {
            $decoded = json_decode($row->MpValue, true);
            $out[$row->MpParameter] = (json_last_error() === JSON_ERROR_NONE)
                ? $decoded
                : $row->MpValue;
        }
        return $out;
    }
}
