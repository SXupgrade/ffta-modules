<?php

/**
 * Redacts RGPD-opted-out archers out of a result payload built from
 * Ianseo's own native Common/OrisFunctions.php builders, before that
 * payload is sent to ianseo.net.
 *
 * IMPORTANT, read before touching this file: the exact key casing Ianseo's
 * own result builders use for name/DOB fields is NOT consistent across
 * result types -- confirmed by static source review of Common/Rank/Obj_Rank_*.php:
 * Obj_Rank_Abs.php / Obj_Rank_FinalInd.php use 'familyname'/'givenname'/'birthdate'
 * (all lowercase), Obj_Rank_GridInd.php / Obj_Rank_Robin.php use 'familyName'/
 * 'givenName'/'birthDate' (camelCase), and Obj_Rank_FinalTeam.php mixes both
 * ('familyname' lowercase, 'birthDate' camelCase) within the same row. This
 * was derived from reading source, not from running Ianseo live -- see this
 * module's README "Verification before production use" section.
 *
 * Rather than hand-maintain a per-result-type key map that a future Ianseo
 * release (or a row shape this static review missed) could silently defeat,
 * this walks every row and matches PII field NAMES case-insensitively
 * against a fixed allowlist (never a substring match -- 'countryName' must
 * never match just because it contains 'name'). Anything not on the
 * allowlist -- ids, country/club, scores, ranks, target numbers -- is left
 * untouched. This is deliberately a defense-in-depth choice: prefer
 * redacting a field this module didn't strictly need to over ever leaving
 * one real name/DOB unredacted because of a casing mismatch.
 */
final class Anonymizer {
    // Compared against strtolower($key) -- so this list only needs the
    // lowercase spelling to catch every camelCase/lowercase variant seen.
    const NAME_KEYS = array('familyname', 'familynameupper', 'givenname', 'athlete', 'tvname', 'name');
    const DOB_KEYS = array('birthdate');
    // Candidate keys holding the numeric Entries.EnId this row is about,
    // checked in order -- confirmed exact for individual qualification rows
    // ('id', Common/Rank/Obj_Rank_Abs.php); the others are defensive
    // fallbacks for row shapes not directly confirmed by static review.
    const ID_KEYS = array('id', 'enid', 'entryid');

    /**
     * @param mixed $value the getXxx()-produced value ($RET->IQ->{event}, etc)
     * @param array<int,bool> $optedOutEntryIds lookup map from GdprRepository::getOptedOutEntryIds()
     * @return mixed the same shape, opted-out archers' PII fields redacted
     */
    public static function redact($value, array $optedOutEntryIds) {
        if (empty($optedOutEntryIds)) {
            return $value;
        }
        return self::walk($value, $optedOutEntryIds);
    }

    private static function walk($node, array $optedOutEntryIds) {
        if ($node instanceof \stdClass) {
            $node = clone $node;
            $entryId = self::findEntryId((array)$node);
            foreach ($node as $key => $value) {
                $node->{$key} = self::redactOrRecurse($key, $value, $entryId, $optedOutEntryIds);
            }
            return $node;
        }

        if (is_array($node)) {
            $entryId = self::findEntryId($node);
            $out = array();
            foreach ($node as $key => $value) {
                $out[$key] = self::redactOrRecurse($key, $value, $entryId, $optedOutEntryIds);
            }
            return $out;
        }

        return $node;
    }

    private static function redactOrRecurse($key, $value, $entryId, array $optedOutEntryIds) {
        if (is_array($value) || $value instanceof \stdClass) {
            return self::walk($value, $optedOutEntryIds);
        }

        if ($entryId === null || empty($optedOutEntryIds[$entryId])) {
            return $value;
        }

        $lowerKey = strtolower((string)$key);
        if (in_array($lowerKey, self::NAME_KEYS, true)) {
            // Given-name-only fields are blanked; anything that could be
            // the single displayed name (family name, "athlete", "name",
            // "tvname") gets the placeholder so whichever one ianseo.net
            // actually renders shows something anonymous, not real data.
            return $lowerKey === 'givenname' ? '' : ('Archer #' . $entryId);
        }
        if (in_array($lowerKey, self::DOB_KEYS, true)) {
            return '';
        }
        return $value;
    }

    private static function findEntryId(array $row) {
        foreach ($row as $key => $value) {
            if (in_array(strtolower((string)$key), self::ID_KEYS, true) && is_numeric($value)) {
                return (int)$value;
            }
        }
        return null;
    }
}
