<?php
/**
 * ffta-modules entry point.
 *
 * Install path inside Ianseo:
 *   Modules/Custom/ffta-modules
 *
 * This file intentionally renders inside the standard Ianseo shell. It must
 * not output its own <!doctype>, <html>, <head> or <body>, otherwise the module
 * becomes a full-page app and breaks the Ianseo navigation/header/footer.
 */
require_once(dirname(dirname(dirname(__FILE__))) . '/config.php');

// Keep the same lightweight ACL pattern used by existing Ianseo modules.
// The module is readable for users allowed to access generic modules.
if (function_exists('checkFullACL')) {
    checkFullACL(AclModules, 'modGeneric', AclReadOnly);
}

$PAGE_TITLE = 'FFTA';

$ianseoLanguage = function_exists('SelectLanguage') ? SelectLanguage() : 'en';
$ianseoLanguage = strtolower((string) $ianseoLanguage);

$moduleBase = './';
$discoveredModules = array();

foreach (glob(__DIR__ . '/modules/*/module.manifest.js') as $manifestPath) {
    $moduleDir = basename(dirname($manifestPath));

    if (!preg_match('/^[a-z0-9][a-z0-9-]*$/', $moduleDir)) {
        continue;
    }

    $discoveredModules[] = array(
        'id' => $moduleDir,
        'manifestPath' => './modules/' . $moduleDir . '/module.manifest.js',
        'basePath' => './modules/' . $moduleDir . '/',
    );
}

usort($discoveredModules, function ($left, $right) {
    if ($left['id'] === 'league') {
        return -1;
    }
    if ($right['id'] === 'league') {
        return 1;
    }
    return strcmp($left['id'], $right['id']);
});

$JS_SCRIPT = array(
    '<link rel="stylesheet" href="' . $moduleBase . 'core/ui/styles/tokens.css">',
    '<link rel="stylesheet" href="' . $moduleBase . 'core/ui/styles/foundation.css">',
    '<link rel="stylesheet" href="' . $moduleBase . 'core/ui/styles/utilities.css">',
    '<script>window.__FFTA_IANSEO_LANGUAGE__ = ' . json_encode($ianseoLanguage) . '; window.__FFTA_MODULES__ = ' . json_encode($discoveredModules, JSON_UNESCAPED_SLASHES) . ';</script>',
    '<script type="module" src="' . $moduleBase . 'main.js"></script>',
);

include('Common/Templates/head.php');
?>
<div class="ffta-modules-shell" data-ianseo-language="<?php echo htmlspecialchars($ianseoLanguage, ENT_QUOTES); ?>">
    <main id="ffta-app" class="ffta-app" data-runtime="ianseo" data-language="<?php echo htmlspecialchars($ianseoLanguage, ENT_QUOTES); ?>"></main>
</div>
<?php
include('Common/Templates/tail.php');
