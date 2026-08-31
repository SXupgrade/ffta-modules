<?php
/**
 * Standalone self-test for domain/Anonymizer.php -- the safety-critical
 * part of this module (it decides which real names/DOBs leave this
 * install). No PHP test framework exists anywhere in this repo yet, so
 * this is a small, dependency-free script rather than introducing one:
 *   php modules/gdpr/tests/anonymizer.selftest.php
 * Exits 0 and prints "OK" on success, exits 1 and prints the failing
 * assertion otherwise.
 */
require_once(__DIR__ . '/../domain/Anonymizer.php');

$failures = array();
$checkCount = 0;

function check($label, $condition) {
    global $failures, $checkCount;
    $checkCount++;
    if (!$condition) {
        $failures[] = $label;
    }
}

// 1. lowercase-cased row (Obj_Rank_Abs style), opted-out archer redacted.
$row = (object)array(
    'id' => 42,
    'familyname' => 'DUPONT',
    'familynameUpper' => 'DUPONT',
    'givenname' => 'Jean',
    'birthdate' => '1990-01-01',
    'countryName' => 'France',
    'club' => 'Archers de Paris',
    'score' => 654,
);
$result = Anonymizer::redact($row, array(42 => true));
check('lowercase row: familyname redacted', $result->familyname === 'Archer #42');
check('lowercase row: familynameUpper redacted', $result->familynameUpper === 'Archer #42');
check('lowercase row: givenname blanked', $result->givenname === '');
check('lowercase row: birthdate blanked', $result->birthdate === '');
check('lowercase row: countryName untouched', $result->countryName === 'France');
check('lowercase row: club untouched', $result->club === 'Archers de Paris');
check('lowercase row: score untouched', $result->score === 654);

// 2. camelCase row (Obj_Rank_GridInd style), NOT opted out -- untouched.
$row2 = (object)array(
    'id' => 7,
    'familyName' => 'MARTIN',
    'givenName' => 'Alice',
    'birthDate' => '1995-05-05',
);
$result2 = Anonymizer::redact($row2, array(42 => true));
check('camelCase row, not opted out: familyName untouched', $result2->familyName === 'MARTIN');
check('camelCase row, not opted out: birthDate untouched', $result2->birthDate === '1995-05-05');

// 3. camelCase row, opted out -- redacted despite different key casing.
$result3 = Anonymizer::redact($row2, array(7 => true));
check('camelCase row, opted out: familyName redacted', $result3->familyName === 'Archer #7');
check('camelCase row, opted out: givenName blanked', $result3->givenName === '');
check('camelCase row, opted out: birthDate blanked', $result3->birthDate === '');

// 4. nested structure (team roster inside a container with no id of its own).
$nested = (object)array(
    'Data' => (object)array(
        'Header' => array('Name', 'Club'),
        'Items' => array(
            (object)array('id' => 1, 'athlete' => 'Team Member One', 'club' => 'Club A'),
            (object)array('id' => 2, 'athlete' => 'Team Member Two', 'club' => 'Club A'),
        ),
    ),
);
$resultNested = Anonymizer::redact($nested, array(1 => true));
check('nested: opted-out member redacted', $resultNested->Data->Items[0]->athlete === 'Archer #1');
check('nested: other member untouched', $resultNested->Data->Items[1]->athlete === 'Team Member Two');
check('nested: club untouched on both', $resultNested->Data->Items[0]->club === 'Club A' && $resultNested->Data->Items[1]->club === 'Club A');

// 5. empty opt-out set is a no-op (also exercises the fast path).
$result5 = Anonymizer::redact($row, array());
check('empty opt-out set: no-op', $result5->familyname === 'DUPONT');

// 6. 'countryName' must never match the 'name' PII key by substring.
$row6 = (object)array('id' => 99, 'countryName' => 'Belgique', 'localbib' => 'BE-01');
$result6 = Anonymizer::redact($row6, array(99 => true));
check('substring safety: countryName not redacted', $result6->countryName === 'Belgique');
check('substring safety: localbib not redacted', $result6->localbib === 'BE-01');

if (!empty($failures)) {
    fwrite(STDERR, "FAILED:\n - " . implode("\n - ", $failures) . "\n");
    exit(1);
}

echo "OK ({$checkCount} checks)\n";
exit(0);
