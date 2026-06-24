<?php
require_once(__DIR__ . '/../database/query.php');

/**
 * Read/write module settings through Ianseo's ModulesParameters table.
 *
 * Important implementation note:
 * Ianseo's native setModuleParameter()/getModuleParameter() treats TourId=0 as
 * "use the current session tournament". FFTA Modules needs real tournament 0
 * settings when no tournament is active, so this adapter uses direct SQL.
 */
class ModulesParametersAdapter {

    private $moduleName;
    private $tourId;

    public function __construct($moduleName = 'ffta-modules', $tourId = null) {
        $this->moduleName = $moduleName;
        $this->tourId = $tourId === null ? $this->resolveTourId() : (int) $tourId;
    }

    public function get($key) {
        $sql = 'SELECT MpValue FROM ModulesParameters'
             . ' WHERE MpModule=' . ffta_sql_string($this->moduleName)
             . ' AND MpParameter=' . ffta_sql_string($key)
             . ' AND MpTournament=' . (int) $this->tourId
             . ' LIMIT 1';
        $row = ffta_fetch_one(ffta_query($sql));
        return $row ? $this->decodeStoredValue($row->MpValue) : null;
    }

    public function set($key, $value) {
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
        $sessionTourId = isset($_SESSION['TourId']) ? (int) $_SESSION['TourId'] : 0;
        if ($sessionTourId <= 0) {
            return 0;
        }

        // Some Ianseo screens may keep an old TourId in session after closing a
        // tournament. Only use it if the tournament still exists.
        $sql = 'SELECT ToId FROM Tournament WHERE ToId=' . (int) $sessionTourId . ' LIMIT 1';
        $row = ffta_fetch_one(ffta_query($sql));
        return $row ? $sessionTourId : 0;
    }

    /**
     * Store JSON inside Ianseo's serialized MpValue field. This keeps values
     * readable for this adapter while staying compatible with Ianseo storage.
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
