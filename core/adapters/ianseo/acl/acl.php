<?php
/**
 * Shared ACL helpers for ffta-modules APIs.
 *
 * Manifest access shape:
 *   access: {
 *     acl: 'AclModules',
 *     subFeature: 'fftaExport',
 *     read: 'AclReadOnly',
 *     write: 'AclReadWrite'
 *   }
 */

function ffta_acl_constant($name, $fallback = null) {
    if (is_int($name)) {
        return $name;
    }
    if (is_string($name) && $name !== '' && defined($name)) {
        return constant($name);
    }
    return $fallback;
}

function ffta_acl_check_silent($acl, $subFeature, $level) {
    if (!function_exists('checkFullACL')) {
        return true;
    }

    $aclValue = ffta_acl_constant($acl, defined('AclModules') ? AclModules : null);
    $levelValue = ffta_acl_constant($level, defined('AclReadOnly') ? AclReadOnly : null);
    $subFeatureValue = is_string($subFeature) && $subFeature !== '' ? $subFeature : 'modGeneric';

    if ($aclValue === null || $levelValue === null) {
        return true;
    }

    try {
        // Ianseo variants commonly accept a fourth parameter to avoid redirect/exit.
        return (bool) checkFullACL($aclValue, $subFeatureValue, $levelValue, false);
    } catch (Throwable $error) {
        try {
            return (bool) checkFullACL($aclValue, $subFeatureValue, $levelValue);
        } catch (Throwable $fallbackError) {
            return false;
        }
    }
}

function ffta_acl_resolve_access(array $access) {
    if (empty($access)) {
        return 'write';
    }

    $acl = isset($access['acl']) ? $access['acl'] : (isset($access['feature']) ? $access['feature'] : 'AclModules');
    $subFeature = isset($access['subFeature']) ? $access['subFeature'] : (isset($access['subfeature']) ? $access['subfeature'] : 'modGeneric');
    $readLevel = isset($access['read']) ? $access['read'] : (isset($access['levels']['read']) ? $access['levels']['read'] : 'AclReadOnly');
    $writeLevel = isset($access['write']) ? $access['write'] : (isset($access['levels']['write']) ? $access['levels']['write'] : 'AclReadWrite');

    if (ffta_acl_check_silent($acl, $subFeature, $writeLevel)) {
        return 'write';
    }
    if (ffta_acl_check_silent($acl, $subFeature, $readLevel)) {
        return 'read';
    }
    return 'none';
}

function ffta_acl_require(array $access, $level = 'read') {
    $resolved = ffta_acl_resolve_access($access);
    if ($level === 'write' && $resolved !== 'write') {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array('ok' => false, 'error' => 'Write access denied.'));
        exit;
    }
    if ($resolved === 'none') {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array('ok' => false, 'error' => 'Access denied.'));
        exit;
    }
    return $resolved;
}
