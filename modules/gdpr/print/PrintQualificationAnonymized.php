<?php
/**
 * "Impressions" tab, document 2: qualification ranking, RGPD-anonymized,
 * one section per individual event of the current tournament.
 *
 * Reuses GdprPublishService::getAnonymizedQualificationSections(), which is
 * the exact same getQualificationIndividual() + Anonymizer::redact() pair
 * already proven by the existing "Publication internet" tab's preview/
 * publish flow -- see that method's own comment for why 'id' is a
 * confirmed-reliable redaction key for this specific row shape (unlike the
 * participants-list document, which deliberately does NOT reuse an Ianseo
 * native builder -- see PrintParticipantsAnonymized.php's own comment).
 *
 * NOT live-verified against a running Ianseo instance/real PDF render (no
 * such environment was available where this was built) -- see this
 * module's README "Verification before production use" for the same
 * disclosure already made for the existing publish feature.
 */
require_once(__DIR__ . '/../../../core/adapters/ianseo/database/bootstrap.php');
require_once(__DIR__ . '/../../../core/adapters/ianseo/database/query.php');
require_once(__DIR__ . '/../../../core/adapters/ianseo/acl/acl.php');
require_once(__DIR__ . '/../application/GdprPublishService.php');

if (function_exists('CheckTourSession')) {
    CheckTourSession(true);
}

$access = array(
    'acl' => 'AclInternetPublish',
    'subFeature' => 'ipSend',
    'read' => 'AclReadOnly',
    'write' => 'AclReadWrite',
);
ffta_acl_require($access, 'read');

require_once('Common/pdf/ResultPDF.inc.php');

$service = new GdprPublishService();
$sections = $service->getAnonymizedQualificationSections();

$pdf = new ResultPDF('RGPD - Qualification ranking (anonymized)');

$columns = array(
    array('label' => 'Rank', 'width' => 15),
    array('label' => 'Name', 'width' => 65),
    array('label' => 'Country', 'width' => 40),
    array('label' => 'Score', 'width' => 25),
);

foreach ($sections as $section) {
    $title = isset($section['meta']['descr']) ? (string)$section['meta']['descr'] : '';
    if ($title !== '') {
        $pdf->SetFont($pdf->FontStd, 'B', $pdf->FontSizeTitle);
        $pdf->Cell(0, 6, $title, 0, 1, 'L');
    }

    $pdf->SetFont($pdf->FontStd, 'B', $pdf->FontSizeHead);
    foreach ($columns as $column) {
        $pdf->Cell($column['width'], 6, $column['label'], 1, 0, 'L', true);
    }
    $pdf->Ln();

    $pdf->SetFont($pdf->FontStd, '', $pdf->FontSizeLines);
    $items = isset($section['items']) && is_array($section['items']) ? $section['items'] : array();
    foreach ($items as $item) {
        $familyName = isset($item['familyname']) ? (string)$item['familyname'] : '';
        $givenName = isset($item['givenname']) ? (string)$item['givenname'] : '';
        $name = trim($familyName . ' ' . $givenName);
        $rank = isset($item['rank']) ? (string)$item['rank'] : '';
        $country = isset($item['countryName']) ? (string)$item['countryName'] : '';
        $score = isset($item['completeScore']) ? (string)$item['completeScore'] : (isset($item['score']) ? (string)$item['score'] : '');

        $pdf->Cell($columns[0]['width'], 5, $rank, 1, 0, 'C');
        $pdf->Cell($columns[1]['width'], 5, $name, 1, 0, 'L');
        $pdf->Cell($columns[2]['width'], 5, $country, 1, 0, 'L');
        $pdf->Cell($columns[3]['width'], 5, $score, 1, 0, 'R');
        $pdf->Ln();
    }

    $pdf->Ln(4);
}

$pdf->Output();
