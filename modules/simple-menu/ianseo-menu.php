<?php
/**
 * Simple Menu hook for Ianseo native menu.
 *
 * Included from Modules/Custom/ffta-modules/menu.php only when the module is
 * enabled. It must be defensive: if anything fails, the native menu is restored.
 */
if (!defined('MENU_DIVIDER') || !isset($ret) || !is_array($ret)) {
    return;
}

$__simpleMenuNative = $ret;
$__simpleMenuDefaultProfile = 'ffta-beginner';
$__simpleMenuSelectedProfile = $__simpleMenuDefaultProfile;

try {
    if (function_exists('getModuleParameter')) {
        $__simpleMenuStoredProfile = getModuleParameter('ffta-modules', 'simpleMenu.profile', $__simpleMenuDefaultProfile, 0, true);
        if (is_string($__simpleMenuStoredProfile) && $__simpleMenuStoredProfile !== '') {
            $__simpleMenuDecodedProfile = json_decode($__simpleMenuStoredProfile, true);
            $__simpleMenuSelectedProfile = is_string($__simpleMenuDecodedProfile) && $__simpleMenuDecodedProfile !== ''
                ? $__simpleMenuDecodedProfile
                : $__simpleMenuStoredProfile;
        }
    }

    $__simpleMenuSelectedProfile = preg_replace('/[^a-zA-Z0-9_-]/', '', $__simpleMenuSelectedProfile);
    if ($__simpleMenuSelectedProfile === '') {
        $__simpleMenuSelectedProfile = $__simpleMenuDefaultProfile;
    }

    $__simpleMenuProfilePath = __DIR__ . '/profiles/' . $__simpleMenuSelectedProfile . '.json';
    if (!is_file($__simpleMenuProfilePath)) {
        $__simpleMenuProfilePath = __DIR__ . '/profiles/' . $__simpleMenuDefaultProfile . '.json';
    }

    if (!is_file($__simpleMenuProfilePath)) {
        return;
    }

    $__simpleMenuProfile = json_decode(file_get_contents($__simpleMenuProfilePath), true);
    if (!is_array($__simpleMenuProfile) || empty($__simpleMenuProfile['menus']) || !is_array($__simpleMenuProfile['menus'])) {
        return;
    }

    $__simpleMenuNext = array();

    if (!function_exists('ffta_simple_menu_resolve_url')) {
        function ffta_simple_menu_resolve_url($url) {
            global $CFG;
            $root = isset($CFG->ROOT_DIR) ? $CFG->ROOT_DIR : '';
            return str_replace('{ROOT_DIR}', $root, (string) $url);
        }
    }

    if (!function_exists('ffta_simple_menu_normalize_url')) {
        function ffta_simple_menu_normalize_url($url) {
            global $CFG;
            $value = ffta_simple_menu_resolve_url($url);
            $root = isset($CFG->ROOT_DIR) ? $CFG->ROOT_DIR : '';
            if ($root !== '' && strpos($value, $root) === 0) {
                $value = substr($value, strlen($root));
            }
            return ltrim($value, '/');
        }
    }

    if (!function_exists('ffta_simple_menu_find_native_item')) {
        function ffta_simple_menu_find_native_item($menu, $url) {
            if (!is_array($menu) || $url === '') {
                return null;
            }

            $needle = ffta_simple_menu_normalize_url($url);
            foreach ($menu as $item) {
                if (is_array($item)) {
                    $found = ffta_simple_menu_find_native_item($item, $url);
                    if ($found !== null) {
                        return $found;
                    }
                    continue;
                }

                if (!is_string($item) || $item === MENU_DIVIDER) {
                    continue;
                }

                $parts = explode('|', $item);
                if (count($parts) < 2) {
                    continue;
                }

                $candidate = ffta_simple_menu_normalize_url($parts[1]);
                if ($candidate === $needle || strpos($candidate, $needle) !== false || strpos($needle, $candidate) !== false) {
                    return $item;
                }
            }

            return null;
        }
    }

    if (!function_exists('ffta_simple_menu_relabel_item')) {
        function ffta_simple_menu_relabel_item($nativeItem, $label) {
            $parts = explode('|', $nativeItem);
            $parts[0] = $label;
            return implode('|', $parts);
        }
    }

    if (!function_exists('ffta_simple_menu_build_direct_item')) {
        function ffta_simple_menu_build_direct_item($label, $url, $target = '') {
            $item = (string) $label . '|' . ffta_simple_menu_resolve_url($url);
            if ($target !== '') {
                $item .= '|' . $target;
            }
            return $item;
        }
    }

    if (!function_exists('ffta_simple_menu_has_action_item')) {
        function ffta_simple_menu_has_action_item($menu) {
            if (!is_array($menu)) {
                return false;
            }

            foreach ($menu as $item) {
                if (is_array($item)) {
                    if (ffta_simple_menu_has_action_item($item)) {
                        return true;
                    }
                    continue;
                }

                if (is_string($item) && $item !== MENU_DIVIDER && strpos($item, '|') !== false) {
                    return true;
                }
            }

            return false;
        }
    }

    $__simpleMenuKeepMenus = isset($__simpleMenuProfile['keepMenus']) && is_array($__simpleMenuProfile['keepMenus'])
        ? $__simpleMenuProfile['keepMenus']
        : array();

    foreach ($__simpleMenuKeepMenus as $__simpleMenuKeepMenuId) {
        if (isset($__simpleMenuNative[$__simpleMenuKeepMenuId]) && is_array($__simpleMenuNative[$__simpleMenuKeepMenuId])) {
            $__simpleMenuNext[$__simpleMenuKeepMenuId] = $__simpleMenuNative[$__simpleMenuKeepMenuId];
        }
    }

    foreach ($__simpleMenuProfile['menus'] as $__simpleMenuDefinition) {
        if (empty($__simpleMenuDefinition['id']) || empty($__simpleMenuDefinition['label']) || empty($__simpleMenuDefinition['items']) || !is_array($__simpleMenuDefinition['items'])) {
            continue;
        }

        $__simpleMenuMenu = array();
        $__simpleMenuMenu[] = (string) $__simpleMenuDefinition['label'];
        $__simpleMenuLastWasDivider = false;

        foreach ($__simpleMenuDefinition['items'] as $__simpleMenuItem) {
            if (!empty($__simpleMenuItem['divider'])) {
                if (!$__simpleMenuLastWasDivider && count($__simpleMenuMenu) > 1) {
                    $__simpleMenuMenu[] = MENU_DIVIDER;
                    $__simpleMenuLastWasDivider = true;
                }
                continue;
            }

            if (empty($__simpleMenuItem['label']) || empty($__simpleMenuItem['url'])) {
                continue;
            }

            $__simpleMenuNativeItem = ffta_simple_menu_find_native_item($__simpleMenuNative, (string) $__simpleMenuItem['url']);
            if ($__simpleMenuNativeItem !== null) {
                $__simpleMenuMenu[] = ffta_simple_menu_relabel_item($__simpleMenuNativeItem, (string) $__simpleMenuItem['label']);
                $__simpleMenuLastWasDivider = false;
                continue;
            }

            if (!empty($__simpleMenuItem['direct'])) {
                $__simpleMenuTarget = isset($__simpleMenuItem['target']) ? (string) $__simpleMenuItem['target'] : '';
                $__simpleMenuMenu[] = ffta_simple_menu_build_direct_item((string) $__simpleMenuItem['label'], (string) $__simpleMenuItem['url'], $__simpleMenuTarget);
                $__simpleMenuLastWasDivider = false;
            }
        }

        while (end($__simpleMenuMenu) === MENU_DIVIDER) {
            array_pop($__simpleMenuMenu);
        }

        if (ffta_simple_menu_has_action_item($__simpleMenuMenu)) {
            $__simpleMenuNext[$__simpleMenuDefinition['id']] = $__simpleMenuMenu;
        }
    }

    if (!empty($__simpleMenuProfile['expertMenu'])) {
        $__simpleMenuHideFromExpert = isset($__simpleMenuProfile['hideFromExpert']) && is_array($__simpleMenuProfile['hideFromExpert'])
            ? $__simpleMenuProfile['hideFromExpert']
            : array();
        $__simpleMenuExpert = array('Menu expert Ianseo');
        foreach ($__simpleMenuNative as $__simpleMenuNativeId => $__simpleMenuNativeMenu) {
            if (in_array($__simpleMenuNativeId, $__simpleMenuKeepMenus, true) || in_array($__simpleMenuNativeId, $__simpleMenuHideFromExpert, true)) {
                continue;
            }
            if (is_array($__simpleMenuNativeMenu) && count($__simpleMenuNativeMenu) > 1) {
                $__simpleMenuExpert[$__simpleMenuNativeId] = $__simpleMenuNativeMenu;
            }
        }
        if (count($__simpleMenuExpert) > 1) {
            $__simpleMenuNext['SIMPLE_EXPERT'] = $__simpleMenuExpert;
        }
    }

    if (count($__simpleMenuNext) > 1) {
        $ret = $__simpleMenuNext;
    } else {
        $ret = $__simpleMenuNative;
    }
} catch (Throwable $__simpleMenuError) {
    $ret = $__simpleMenuNative;
} catch (Exception $__simpleMenuError) {
    $ret = $__simpleMenuNative;
}

unset(
    $__simpleMenuNative,
    $__simpleMenuDefaultProfile,
    $__simpleMenuSelectedProfile,
    $__simpleMenuStoredProfile,
    $__simpleMenuDecodedProfile,
    $__simpleMenuProfilePath,
    $__simpleMenuProfile,
    $__simpleMenuNext,
    $__simpleMenuKeepMenus,
    $__simpleMenuKeepMenuId,
    $__simpleMenuDefinition,
    $__simpleMenuMenu,
    $__simpleMenuLastWasDivider,
    $__simpleMenuItem,
    $__simpleMenuNativeItem,
    $__simpleMenuTarget,
    $__simpleMenuHideFromExpert,
    $__simpleMenuExpert,
    $__simpleMenuNativeId,
    $__simpleMenuNativeMenu,
    $__simpleMenuError
);
?>
