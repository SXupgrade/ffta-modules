<?php
require_once(dirname(dirname(dirname(__FILE__))) . '/config.php');

if (function_exists('checkFullACL')) {
    checkFullACL(AclModules, 'modGeneric', AclReadOnly);
}

$route = isset($_GET['route']) ? trim((string)$_GET['route']) : '';

if ($route !== '') {
    header('Location: ./#/' . rawurlencode($route));
    exit;
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
    if ($left['id'] === 'league') return -1;
    if ($right['id'] === 'league') return 1;
    return strcmp($left['id'], $right['id']);
});

$JS_SCRIPT = array(
    '<link rel="stylesheet" href="' . $moduleBase . 'core/ui/styles/tokens.css">',
    '<link rel="stylesheet" href="' . $moduleBase . 'core/ui/styles/foundation.css">',
    '<link rel="stylesheet" href="' . $moduleBase . 'core/ui/styles/utilities.css">',
    '<link rel="stylesheet" href="' . $moduleBase . 'core/ui/styles/print.css" media="print">',
    '<script>window.__FFTA_IANSEO_LANGUAGE__ = ' . json_encode($ianseoLanguage) . '; window.__FFTA_MODULES__ = ' . json_encode($discoveredModules, JSON_UNESCAPED_SLASHES) . ';</script>',
    '<script type="module" src="' . $moduleBase . 'main.js"></script>',
);

include('Common/Templates/head.php');
?>
<div class="ffta-modules-shell" data-ianseo-language="<?php echo htmlspecialchars($ianseoLanguage, ENT_QUOTES); ?>">
    <main id="ffta-app" class="ffta-app" data-runtime="ianseo" data-language="<?php echo htmlspecialchars($ianseoLanguage, ENT_QUOTES); ?>"></main>
</div>
<?php include('Common/Templates/tail.php'); ?>
