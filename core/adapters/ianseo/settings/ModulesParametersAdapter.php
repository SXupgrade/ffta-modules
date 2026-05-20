<?php
require_once(__DIR__ . '/../database/query.php');

/**
 * Read/write module settings through Ianseo's ModulesParameters table.
 *
 * Ianseo schema:
 *   ModulesParameters(MpModule, MpParameter, MpTournament, MpValue)
 *
 * Ianseo stores module parameters per tournament. We keep the same behavior so
 * settings follow the active tournament context and remain export-compatible.
 */
class ModulesParametersAdapter {

    private $moduleName;
    private $tourId;

    public function __construct($moduleName = 'ffta-modules', $tourId = null) {
        $this->moduleName = $moduleName;
        $this->tourId = $tourId === null ? $this->resolveTourId() : (int) $tourId;
    }

    public function get($key) {
        if (function_exists('getModuleParameter')) {
            $value = getModuleParameter($this->moduleName, $key, null, $this->tourId, true);
            return $this->decodeValue($value);
        }

        $sql = 'SELECT MpValue FROM ModulesParameters'
             . ' WHERE MpModule=' . ffta_sql_string($this->moduleName)
             . ' AND MpParameter=' . ffta_sql_string($key)
             . ' AND MpTournament=' . (int) $this->tourId
             . ' LIMIT 1';
        $row = ffta_fetch_one(ffta_query($sql));
        return $row ? $this->decodeStoredValue($row->MpValue) : null;
    }

    public function set($key, $value) {
        if (function_exists('setModuleParameter')) {
            setModuleParameter($this->moduleName, $key, $this->encodeValue($value), $this->tourId);
            return true;
        }

        $stored = serialize($this->encodeValue($value));
        $sql = 'INSERT INTO ModulesParameters SET '
             . 'MpValue=' . ffta_sql_string($stored) . ', '
             . 'MpModule=' . ffta_sql_string($this->moduleName) . ', '
             . 'MpParameter=' . ffta_sql_string($key) . ', '
             . 'MpTournament=' . (int) $this->tourId . ' '
             . 'ON DUPLICATE KEY UPDATE MpValue=' . ffta_sql_string($stored);
        ffta_write($sql);
        return true;
    }

    public function getAll() {
        if (function_exists('getModule')) {
            $values = getModule($this->moduleName, '', $this->tourId);
            $out = array();
            foreach ($values as $key => $value) {
                $out[$key] = $this->decodeValue($value);
            }
            return $out;
        }

        $sql = 'SELECT MpParameter, MpValue FROM ModulesParameters'
             . ' WHERE MpModule=' . ffta_sql_string($this->moduleName)
             . ' AND MpTournament=' . (int) $this->tourId;
        $rows = ffta_fetch_all(ffta_query($sql));
        $out = array();
        foreach ($rows as $row) {
            $out[$row->MpParameter] = $this->decodeStoredValue($row->MpValue);
        }
        return $out;
    }

    private function resolveTourId() {
        return isset($_SESSION['TourId']) ? (int) $_SESSION['TourId'] : 0;
    }

    /**
     * Keep Ianseo storage compatible while still supporting JSON-like values.
     */
    private function encodeValue($value) {
        return json_encode($value, JSON_UNESCAPED_UNICODE);
    }

    private function decodeValue($value) {
        if ($value === null || $value === '') {
            return $value;
        }
        $decoded = json_decode($value, true);
        return (json_last_error() === JSON_ERROR_NONE) ? $decoded : $value;
    }

    private function decodeStoredValue($stored) {
        $unserialized = @unserialize($stored);
        if ($unserialized !== false || $stored === 'b:0;') {
            return $this->decodeValue($unserialized);
        }
        return $this->decodeValue($stored);
    }
}
