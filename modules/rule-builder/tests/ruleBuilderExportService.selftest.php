<?php
/**
 * Standalone self-test for RuleBuilderExportService's shaping logic -- no
 * PHP test framework exists anywhere in this repo yet (same rationale as
 * modules/gdpr/tests/anonymizer.selftest.php), and no live Ianseo/MySQL
 * instance is available in this environment to exercise
 * IanseoRuleBuilderRepository's real queries against, so this stubs the
 * repository with canned rows and checks the assembled JSON shape instead:
 *   php modules/rule-builder/tests/ruleBuilderExportService.selftest.php
 * Exits 0 and prints "OK" on success, exits 1 and prints the failing
 * assertion otherwise.
 *
 * Deliberately does NOT `extends IanseoRuleBuilderRepository` -- doing so
 * would load that class's own require_once chain up through
 * core/adapters/ianseo/database/bootstrap.php, which refuses to load
 * outside a real Ianseo install (see RuleBuilderExportService's
 * constructor comment). This stub is a plain, unrelated class that
 * implements the same method names.
 */
require_once(__DIR__ . '/../application/RuleBuilderExportService.php');

class StubRuleBuilderRepository {
    public function getCurrentTournamentId() { return 999; }

    public function getTournamentSummary($tourId) {
        return (object)array(
            'ToId' => $tourId, 'ToName' => 'Concours Test', 'ToTypeName' => 'Type_70m Round',
            'ToTypeSubRule' => 'SetFRTAE-Valides', 'ToWhenFrom' => '2026-06-06', 'ToWhenTo' => '2026-06-07',
        );
    }

    public function getTournament($tourId) {
        return (object)array(
            'ToType' => 3, 'ToLocRule' => 'FR', 'ToTypeName' => 'Type_70m Round', 'ToTypeSubRule' => 'SetFRTAE-Valides',
            'ToCategory' => 1, 'ToNumDist' => 2, 'ToNumEnds' => 12, 'ToMaxDistScore' => 360,
            'ToMaxFinIndScore' => 150, 'ToMaxFinTeamScore' => 240, 'ToElabTeam' => 0, 'ToElimination' => 0,
            'ToGolds' => '10+X', 'ToGoldsChars' => 'KL', 'ToXNine' => 'X', 'ToXNineChars' => 'K',
            'ToDouble' => 0, 'ToIocCode' => 'FRA', 'ToCollation' => '',
        );
    }

    public function getDivisions($tourId) {
        return array((object)array(
            'DivViewOrder' => 1, 'DivId' => 'CL', 'DivDescription' => 'Arc Classique', 'DivAthlete' => '1',
            'DivRecDivision' => 'R', 'DivWaDivision' => 'R', 'DivIsPara' => 0,
        ));
    }

    public function getClasses($tourId) {
        return array((object)array(
            'ClViewOrder' => 1, 'ClAgeFrom' => 1, 'ClAgeTo' => 10, 'ClSex' => 1, 'ClId' => 'U11F',
            'ClValidClass' => 'U11F,U13F', 'ClDescription' => 'U11 Femmes', 'ClAthlete' => '1',
            'ClDivisionsAllowed' => 'CL', 'ClRecClass' => '', 'ClWaClass' => '', 'ClIsPara' => 0,
        ));
    }

    public function getSubClasses($tourId) {
        return array((object)array('ScViewOrder' => 1, 'ScId' => 'A', 'ScDescription' => 'Adulte'));
    }

    public function getEvents($tourId) {
        $individual = (object)array(
            'EvTeamEvent' => 0, 'EvFinalFirstPhase' => 0, 'EvWinnerFinalRank' => 1, 'EvNumQualified' => 0,
            'EvFirstQualified' => 1, 'EvGolds' => '10+X', 'EvXNine' => 'X', 'EvGoldsChars' => 'KL',
            'EvXNineChars' => 'K', 'EvCheckGolds' => 0, 'EvCheckXNines' => 0, 'EvFinalAthTarget' => 0,
            'EvMatchMultipleMatches' => 0, 'EvElimType' => 0, 'EvElim1' => 0, 'EvE1Ends' => 5, 'EvE1Arrows' => 3,
            'EvE1SO' => 1, 'EvElim2' => 0, 'EvE2Ends' => 5, 'EvE2Arrows' => 3, 'EvE2SO' => 1, 'EvPartialTeam' => 0,
            'EvMultiTeam' => 0, 'EvMultiTeamNo' => 0, 'EvMixedTeam' => 0, 'EvTeamCreationMode' => 0,
            'EvMaxTeamPerson' => 1, 'EvMatchArrowsNo' => 0, 'EvElimEnds' => 5, 'EvElimArrows' => 3, 'EvElimSO' => 1,
            'EvFinEnds' => 5, 'EvFinArrows' => 3, 'EvFinSO' => 1, 'EvMedals' => 1, 'EvTourRules' => '',
            'EvCodeParent' => '', 'EvCodeParentWinnerBranch' => 0, 'EvIsPara' => 0, 'EvArrowPenalty' => 120,
            'EvLoopPenalty' => 120, 'EvLockResults' => 0, 'EvQualBestOfDistances' => 0, 'EvProgr' => 1,
            'EvCode' => 'U11FCL', 'EvEventName' => 'U11 Femme Arc Classique', 'EvFinalTargetType' => 5,
            'EvTargetSize' => 80, 'EvDistance' => '20', 'EvRecCategory' => '', 'EvWaCategory' => '', 'EvMatchMode' => 1,
        );
        $team = clone $individual;
        $team->EvTeamEvent = 1;
        $team->EvCode = 'U11FCLT';
        $team->EvEventName = 'U11 Femme Arc Classique Equipe';
        $team->EvProgr = 2;
        return array($individual, $team);
    }

    public function getEventClasses($tourId) {
        return array((object)array(
            'EcTeamEvent' => 0, 'EcNumber' => 1, 'EcCode' => 'U11FCL', 'EcDivision' => 'CL', 'EcClass' => 'U11F',
            'EcSubClass' => '', 'EcExtraAddons' => 0,
        ));
    }

    public function getTournamentDistances($tourId) {
        return array((object)array(
            'TdType' => 3, 'TdClasses' => 'BBS%',
            'Td1' => '50m-1', 'TdDist1' => 50, 'Td2' => '50m-2', 'TdDist2' => 50, 'Td3' => '30m-1', 'TdDist3' => 30,
            'Td4' => '', 'TdDist4' => 0, 'Td5' => '', 'TdDist5' => 0, 'Td6' => '', 'TdDist6' => 0,
            'Td7' => '', 'TdDist7' => 0, 'Td8' => '', 'TdDist8' => 0,
        ));
    }

    public function getDistanceInformation($tourId) {
        return array((object)array('DiType' => 'Q', 'DiSession' => 1, 'DiDistance' => 1, 'DiEnds' => 6, 'DiArrows' => 6));
    }

    public function getTargetFaces($tourId) {
        $regexRow = (object)array(
            'TfId' => 1, 'TfName' => 'Blason Complet 80', 'TfClasses' => '', 'TfRegExp' => '(^CLU1[0-7])',
            'TfDefault' => '1',
            'TfT1' => 5, 'TfW1' => 80, 'TfT2' => 5, 'TfW2' => 80, 'TfT3' => 6, 'TfW3' => 60,
            'TfT4' => 0, 'TfW4' => 0, 'TfT5' => 0, 'TfW5' => 0, 'TfT6' => 0, 'TfW6' => 0, 'TfT7' => 0, 'TfW7' => 0, 'TfT8' => 0, 'TfW8' => 0,
        );
        $classesRow = (object)array(
            'TfId' => 2, 'TfName' => 'Blason 40', 'TfClasses' => 'DEC', 'TfRegExp' => '',
            'TfDefault' => '',
            'TfT1' => 5, 'TfW1' => 40,
            'TfT2' => 0, 'TfW2' => 0, 'TfT3' => 0, 'TfW3' => 0, 'TfT4' => 0, 'TfW4' => 0,
            'TfT5' => 0, 'TfW5' => 0, 'TfT6' => 0, 'TfW6' => 0, 'TfT7' => 0, 'TfW7' => 0, 'TfT8' => 0, 'TfW8' => 0,
        );
        return array($regexRow, $classesRow);
    }

    public function getSessions($tourId) {
        return array((object)array(
            'SesOrder' => 1, 'SesType' => 'Q', 'SesName' => 'Départ 1', 'SesTar4Session' => 10,
            'SesAth4Target' => 3, 'SesFirstTarget' => 1, 'SesFollow' => 0,
        ));
    }
}

$failures = array();
$checkCount = 0;

function check($label, $condition) {
    global $failures, $checkCount;
    $checkCount++;
    if (!$condition) {
        $failures[] = $label;
    }
}

$service = new RuleBuilderExportService(new StubRuleBuilderRepository());
$built = $service->build();

// 1. Top-level shape.
check('top-level keys', array_keys($built) === array('Tournament', 'Divisions', 'Classes', 'Events', 'Distances', 'Blasons', 'Sessions'));

// 2. Tournament: no ToSubRule (documented omission -- not a real column).
check('Tournament has no ToSubRule', !array_key_exists('ToSubRule', $built['Tournament']));
check('Tournament ToType', $built['Tournament']['ToType'] === 3);
check('Tournament ToTypeSubRule', $built['Tournament']['ToTypeSubRule'] === 'SetFRTAE-Valides');

// 3. Divisions: {ToId} placeholder substitution.
check('Divisions count', count($built['Divisions']) === 1);
check('Divisions {ToId} placeholder', $built['Divisions'][0]['DivTournament'] === '{ToId}');
check('Divisions DivId', $built['Divisions'][0]['DivId'] === 'CL');

// 4. Classes: seasonStartDate/ageShiftWhenSeasonStarted fixed metadata, no
//    fallback on blank ClRecClass/ClWaClass, SubClass merged after Classes.
check('Classes.seasonStartDate', $built['Classes']['seasonStartDate'] === '09-01');
check('Classes.ageShiftWhenSeasonStarted is 0 (as-is export, no shift reversal)', $built['Classes']['ageShiftWhenSeasonStarted'] === 0);
check('Classes.items count (1 class + 1 subclass)', count($built['Classes']['items']) === 2);
check('Classes.items[0] is the Class row', $built['Classes']['items'][0]['ClId'] === 'U11F');
check('Classes.items[0].ClRecClass stays blank (no fallback to ClId)', $built['Classes']['items'][0]['ClRecClass'] === '');
check('Classes.items[1] is the merged SubClass row', $built['Classes']['items'][1]['ScId'] === 'A');
check('Classes.items[1] SubClass {ToId} placeholder', $built['Classes']['items'][1]['ScTournament'] === '{ToId}');

// 5. Events: individual + team both in the same flat `items` array.
check('Events.items count (1 individual + 1 team)', count($built['Events']['items']) === 2);
check('Events.items[0] individual', $built['Events']['items'][0]['EvTeamEvent'] === 0);
check('Events.items[1] team', $built['Events']['items'][1]['EvTeamEvent'] === 1);
check('Events.items[0] {ToId} placeholder', $built['Events']['items'][0]['EvTournament'] === '{ToId}');
check('Events.classes count', count($built['Events']['classes']) === 1);
check('Events.classes[0] EcCode', $built['Events']['classes'][0]['EcCode'] === 'U11FCL');

// 6. Distances: Td trimming keeps only the non-empty pairs (3 here, not 8).
$round = $built['Distances']['rounds'][0];
check('Distances.rounds[0] keeps exactly Td1..Td3/TdDist1..TdDist3',
    isset($round['Td3']) && isset($round['TdDist3']) && !isset($round['Td4']) && !isset($round['TdDist4']));
check('Distances.rounds[0] Td1 value', $round['Td1'] === '50m-1' && $round['TdDist1'] === 50);
check('Distances.information count', count($built['Distances']['information']) === 1);

// 7. Blasons: TfRegExp wins over TfClasses when non-empty; T/W trimming;
//    the other row falls back to TfClasses when TfRegExp is blank.
$blasonRegex = $built['Blasons'][0];
check('Blasons[0] uses TfRegExp (non-empty wins)', isset($blasonRegex['TfRegExp']) && !isset($blasonRegex['TfClasses']));
check('Blasons[0] T/W trimmed to 3 pairs', isset($blasonRegex['TfT3']) && !isset($blasonRegex['TfT4']));
$blasonClasses = $built['Blasons'][1];
check('Blasons[1] falls back to TfClasses (TfRegExp blank)', isset($blasonClasses['TfClasses']) && !isset($blasonClasses['TfRegExp']));
check('Blasons[1] T/W trimmed to 1 pair (minimum kept)', isset($blasonClasses['TfT1']) && !isset($blasonClasses['TfT2']));

// 8. Sessions: SesFollow exported as string, matching the ground-truth
//    export's literal shape even though the live column is numeric.
check('Sessions[0] SesFollow is a string', $built['Sessions'][0]['SesFollow'] === '0' && is_string($built['Sessions'][0]['SesFollow']));
check('Sessions[0] {ToId} placeholder', $built['Sessions'][0]['SesTournament'] === '{ToId}');

// 9. Whole tree round-trips through json_encode (this is what api/rule-builder.php ships).
$json = json_encode($built);
check('json_encode succeeds', $json !== false);
$decoded = json_decode($json, true);
check('json round-trip preserves shape', $decoded['Tournament']['ToType'] === 3 && count($decoded['Divisions']) === 1);

if (!empty($failures)) {
    fwrite(STDERR, "FAILED:\n - " . implode("\n - ", $failures) . "\n");
    exit(1);
}

echo "OK ({$checkCount} checks)\n";
exit(0);
