<?php
/**
 * "Impressions" tab, document 1: alphabetical participants list, RGPD-
 * anonymized (opted-out archers shown as "Archer #<EnId>" instead of their
 * real name).
 *
 * Deliberately NOT a reuse of Ianseo's own Partecipants/PrnAlphabetical.php
 * chunk-rendering pipeline (PdfChunkLoader('Alphabetical.inc.php') +
 * getStartListAlphabetical()): that query (Common/StartListQueries.php's
 * getStartListAlphaQuery()) does not even select Entries.EnId, so there is
 * no reliable key to redact by without patching Ianseo's own query -- which
 * this repo must never do (see README "Constraints": only Modules/Custom/
 * survives an Ianseo update, native Tournament/*.php files get overwritten).
 * Renders its own simple table instead, from IanseoGdprRepository::
 * getParticipants() (already tournament-scoped, already carries the
 * opt-out flag) -- redacted at the source query, not after the fact, so
 * there is no risk of ever fetching a real name for an opted-out row.
 *
 * NOT live-verified against a running Ianseo instance/real PDF render (no
 * such environment was available where this was built) -- only php -l and a
 * careful, conservative reading of Common/pdf/ResultPDF.inc.php's own
 * inherited TCPDF API (Cell/Ln/SetFont, standard and stable). See this
 * module's README "Verification before production use" for the same
 * disclosure already made for the existing publish feature.
 */
require_once(__DIR__ . '/../../../core/adapters/ianseo/database/bootstrap.php');
require_once(__DIR__ . '/../../../core/adapters/ianseo/database/query.php');
require_once(__DIR__ . '/../../../core/adapters/ianseo/acl/acl.php');
require_once(__DIR__ . '/../repositories/ianseo/IanseoGdprRepository.php');

if (function_exists('CheckTourSession')) {
    CheckTourSession(true);
}

// Same ACL bit the rest of this module already gates itself on.
$access = array(
    'acl' => 'AclInternetPublish',
    'subFeature' => 'ipSend',
    'read' => 'AclReadOnly',
    'write' => 'AclReadWrite',
);
ffta_acl_require($access, 'read');

require_once('Common/pdf/ResultPDF.inc.php');

$repository = new IanseoGdprRepository();
$tourId = $repository->getCurrentTournamentId();
$participants = $repository->getParticipants($tourId);

$pdf = new ResultPDF('RGPD - Participants list (anonymized)');

$columns = array(
    array('label' => 'Name', 'width' => 75),
    array('label' => 'Club', 'width' => 60),
    array('label' => 'Division / Class', 'width' => 45),
);

$pdf->SetFont($pdf->FontStd, 'B', $pdf->FontSizeHead);
foreach ($columns as $column) {
    $pdf->Cell($column['width'], 6, $column['label'], 1, 0, 'L', true);
}
$pdf->Ln();

$pdf->SetFont($pdf->FontStd, '', $pdf->FontSizeLines);
foreach ($participants as $participant) {
    $name = $participant->optedOut
        ? ('Archer #' . $participant->entryId)
        : trim($participant->lastName . ' ' . $participant->firstName);
    $club = $participant->clubName !== '' ? $participant->clubName : $participant->clubCode;
    $category = trim($participant->division . ' ' . $participant->class);

    $pdf->Cell($columns[0]['width'], 5, $name, 1, 0, 'L');
    $pdf->Cell($columns[1]['width'], 5, $club, 1, 0, 'L');
    $pdf->Cell($columns[2]['width'], 5, $category, 1, 0, 'L');
    $pdf->Ln();
}

$pdf->Output();
