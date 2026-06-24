<?php
/**
 * FFTA modules Ianseo menu bridge.
 *
 * Keep the native FFTA entry stable, then optionally let enabled FFTA modules
 * post-process the already-built Ianseo menu. This file is included by
 * Common/Menu.php inside get_which_menu(), so every hook must be defensive.
 */
$ret['FFTA'][] = 'FFTA' . '|' . $CFG->ROOT_DIR . 'Modules/Custom/ffta-modules/';
$ret['FFTA']['Menu'] = 'FFTA' . '|' . $CFG->ROOT_DIR . 'Modules/Custom/ffta-modules/';

if (!function_exists('ffta_menu_sql_string')) {
    function ffta_menu_sql_string($value) {
        if (function_exists('StrSafe_DB')) {
            return StrSafe_DB($value);
        }
        return "'" . addslashes((string) $value) . "'";
    }
}

if (!function_exists('ffta_menu_resolve_tour_id')) {
    function ffta_menu_resolve_tour_id() {
        $sessionTourId = isset($_SESSION['TourId']) ? (int) $_SESSION['TourId'] : 0;
        if ($sessionTourId <= 0 || !function_exists('safe_r_sql')) {
            return 0;
        }
        $rs = safe_r_sql('SELECT ToId FROM Tournament WHERE ToId=' . (int) $sessionTourId . ' LIMIT 1');
        return ($rs && safe_fetch($rs)) ? $sessionTourId : 0;
    }
}

if (!function_exists('ffta_menu_get_parameter')) {
    function ffta_menu_get_parameter($key, $defaultValue = null) {
        if (!function_exists('safe_r_sql')) {
            return $defaultValue;
        }

        $tourId = ffta_menu_resolve_tour_id();
        $sql = 'SELECT MpValue FROM ModulesParameters'
             . ' WHERE MpModule=' . ffta_menu_sql_string('ffta-modules')
             . ' AND MpParameter=' . ffta_menu_sql_string($key)
             . ' AND MpTournament=' . (int) $tourId
             . ' LIMIT 1';
        $rs = safe_r_sql($sql);
        $row = $rs ? safe_fetch($rs) : null;
        if (!$row) {
            return $defaultValue;
        }

        $value = $row->MpValue;
        if ($value !== '' && ($tmp = @unserialize($value)) !== false) {
            $value = $tmp;
        }
        $decoded = is_string($value) ? json_decode($value, true) : null;
        return json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
    }
}

$__fftaMenuBackup = $ret;

try {
    $__fftaEnabledModules = ffta_menu_get_parameter('enabledModules', array());
    if (!is_array($__fftaEnabledModules)) {
        $__fftaEnabledModules = array();
    }

    if (in_array('simple-menu', $__fftaEnabledModules, true)) {
        $__fftaSimpleMenuHook = __DIR__ . '/modules/simple-menu/ianseo-menu.php';
        if (is_file($__fftaSimpleMenuHook)) {
            include($__fftaSimpleMenuHook);
        }
    }

    if (!is_array($ret) || count($ret) === 0) {
        $ret = $__fftaMenuBackup;
    }
} catch (Throwable $__fftaMenuError) {
    $ret = $__fftaMenuBackup;
} catch (Exception $__fftaMenuError) {
    $ret = $__fftaMenuBackup;
}

unset(
    $__fftaMenuBackup,
    $__fftaEnabledModules,
    $__fftaSimpleMenuHook,
    $__fftaMenuError
);
?>
