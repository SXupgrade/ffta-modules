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

$__fftaMenuBackup = $ret;

try {
    $__fftaEnabledModules = array();

    if (function_exists('getModuleParameter')) {
        $__fftaStoredEnabledModules = getModuleParameter('ffta-modules', 'enabledModules', null, 0, true);

        if (is_array($__fftaStoredEnabledModules)) {
            $__fftaEnabledModules = $__fftaStoredEnabledModules;
        } elseif (is_string($__fftaStoredEnabledModules) && $__fftaStoredEnabledModules !== '') {
            $__fftaDecodedEnabledModules = json_decode($__fftaStoredEnabledModules, true);
            if (is_array($__fftaDecodedEnabledModules)) {
                $__fftaEnabledModules = $__fftaDecodedEnabledModules;
            }
        }
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
    $__fftaStoredEnabledModules,
    $__fftaDecodedEnabledModules,
    $__fftaSimpleMenuHook,
    $__fftaMenuError
);
?>
