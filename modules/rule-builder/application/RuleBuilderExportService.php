<?php

/**
 * Builds the same {Tournament,Divisions,Classes,Events,Distances,Blasons,
 * Sessions} JSON shape compet+'s scripts/rules/generate-fr-ianseo-sets.js
 * produces from static Custom/sets/FR/* templates, except sourced from one
 * already-open, live tournament's actual configured rules instead of a
 * hand-maintained template -- see this module's README for the full
 * picture and the design decisions below.
 *
 * Three deliberate departures from what a hand-authored FR template would
 * contain, each because a live tournament simply doesn't carry the
 * information a hand-authored template does:
 *
 * - `Tournament.ToSubRule` is omitted. It identifies which entry of
 *   compet+'s own SET_DEFS catalog a static template corresponds to
 *   (scripts/rules/run.js) -- it is not an Ianseo database column at all
 *   (confirmed against the real Tournament table's full column list), so
 *   there is no live value to read for an arbitrary organizer-configured
 *   tournament.
 * - `Classes.ageShiftWhenSeasonStarted` is always 0, and ClAgeFrom/ClAgeTo
 *   are exported exactly as stored. A static FR template bakes in a fixed
 *   age-shift convention (September-start school-year classes) applied at
 *   tournament-creation time by ianseo-set-adapter.js. A live tournament's
 *   stored ages are already whatever they resolved to for that one
 *   tournament's own date -- and may since have been hand-edited by an
 *   organizer via Ianseo's ManDivClass.php screen, with no reliable way to
 *   tell shifted-at-creation apart from edited-since. Reversing an assumed
 *   shift on data we cannot verify was ever shifted risks silently
 *   producing wrong ages; exporting as-is is always correct for what was
 *   actually captured. Practical effect: a live-extracted ruleset reused
 *   for a future tournament will NOT auto-shift ages for that tournament's
 *   own season -- document this to whoever re-imports one.
 *
 * See core/adapters/ianseo repository for the column-level rationale
 * (runtime/bookkeeping columns intentionally excluded).
 */
final class RuleBuilderExportService {
    const TOID_PLACEHOLDER = '{ToId}';

    private $repository;

    /**
     * No class type-hint on $repository (unlike this repo's usual
     * convention, e.g. GdprPublishService's `IanseoGdprRepository
     * $repository`) so this class can be unit-tested with a plain stub
     * object, without ever loading IanseoRuleBuilderRepository.php's own
     * require_once chain up through core/adapters/ianseo/database/
     * bootstrap.php -- which refuses to load (by design, see that file's
     * header comment: "must reuse the host Ianseo runtime") outside a real
     * Ianseo install. The require_once below only fires for the default,
     * production path (no repository passed in) -- see
     * tests/ruleBuilderExportService.selftest.php for the stubbed path.
     */
    public function __construct($repository = null) {
        if ($repository === null) {
            require_once(__DIR__ . '/../repositories/ianseo/IanseoRuleBuilderRepository.php');
            $repository = new IanseoRuleBuilderRepository();
        }
        $this->repository = $repository;
    }

    /**
     * "You are about to export..." identification for the screen -- not
     * part of the exported ruleset itself.
     */
    public function getStatus() {
        $tourId = $this->repository->getCurrentTournamentId();
        $summary = $this->repository->getTournamentSummary($tourId);
        return array(
            'tournamentId' => $tourId,
            'name' => (string)$summary->ToName,
            'typeName' => (string)$summary->ToTypeName,
            'typeSubRule' => (string)$summary->ToTypeSubRule,
            'whenFrom' => (string)$summary->ToWhenFrom,
            'whenTo' => (string)$summary->ToWhenTo,
        );
    }

    public function build() {
        return $this->buildForTournament($this->repository->getCurrentTournamentId());
    }

    public function buildForTournament($tourId) {
        $tourId = (int)$tourId;

        $tournament = $this->repository->getTournament($tourId);
        $divisions = $this->repository->getDivisions($tourId);
        $classes = $this->repository->getClasses($tourId);
        $subClasses = $this->repository->getSubClasses($tourId);
        $events = $this->repository->getEvents($tourId);
        $eventClasses = $this->repository->getEventClasses($tourId);
        $distances = $this->repository->getTournamentDistances($tourId);
        $distanceInfo = $this->repository->getDistanceInformation($tourId);
        $targetFaces = $this->repository->getTargetFaces($tourId);
        $sessions = $this->repository->getSessions($tourId);

        return array(
            'Tournament' => $this->shapeTournament($tournament),
            'Divisions' => array_map(array($this, 'shapeDivision'), $divisions),
            'Classes' => array(
                'seasonStartDate' => '09-01',
                'ageShiftWhenSeasonStarted' => 0,
                // SubClass rows are merged into the same flat list as Class
                // rows, classes first -- reproducing generate-fr-ianseo-sets.js's
                // createClass()/createSubClass(), which push into the very
                // same output array (see IanseoRuleBuilderRepository::getSubClasses()).
                'items' => array_merge(
                    array_map(array($this, 'shapeClass'), $classes),
                    array_map(array($this, 'shapeSubClass'), $subClasses)
                ),
            ),
            'Events' => array(
                'items' => array_map(array($this, 'shapeEvent'), $events),
                'classes' => array_map(array($this, 'shapeEventClass'), $eventClasses),
            ),
            'Distances' => array(
                'rounds' => array_map(array($this, 'shapeDistanceRound'), $distances),
                'information' => array_map(array($this, 'shapeDistanceInformation'), $distanceInfo),
            ),
            'Blasons' => array_map(array($this, 'shapeTargetFace'), $targetFaces),
            'Sessions' => array_map(array($this, 'shapeSession'), $sessions),
        );
    }

    private function shapeTournament($row) {
        return array(
            'ToType' => (int)$row->ToType,
            'ToLocRule' => (string)$row->ToLocRule,
            'ToTypeName' => (string)$row->ToTypeName,
            'ToTypeSubRule' => (string)$row->ToTypeSubRule,
            'ToCategory' => (int)$row->ToCategory,
            'ToNumDist' => (int)$row->ToNumDist,
            'ToNumEnds' => (int)$row->ToNumEnds,
            'ToMaxDistScore' => (int)$row->ToMaxDistScore,
            'ToMaxFinIndScore' => (int)$row->ToMaxFinIndScore,
            'ToMaxFinTeamScore' => (int)$row->ToMaxFinTeamScore,
            'ToElabTeam' => (int)$row->ToElabTeam,
            'ToElimination' => (int)$row->ToElimination,
            'ToGolds' => (string)$row->ToGolds,
            'ToGoldsChars' => (string)$row->ToGoldsChars,
            'ToXNine' => (string)$row->ToXNine,
            'ToXNineChars' => (string)$row->ToXNineChars,
            'ToDouble' => (int)$row->ToDouble,
            'ToIocCode' => (string)$row->ToIocCode,
            'ToCollation' => (string)$row->ToCollation,
        );
    }

    private function shapeDivision($row) {
        return array(
            'DivTournament' => self::TOID_PLACEHOLDER,
            'DivViewOrder' => (int)$row->DivViewOrder,
            'DivId' => (string)$row->DivId,
            'DivDescription' => (string)$row->DivDescription,
            'DivAthlete' => (int)$row->DivAthlete,
            'DivRecDivision' => (string)$row->DivRecDivision,
            'DivWaDivision' => (string)$row->DivWaDivision,
            'DivIsPara' => (int)$row->DivIsPara,
        );
    }

    private function shapeClass($row) {
        return array(
            'ClTournament' => self::TOID_PLACEHOLDER,
            'ClViewOrder' => (int)$row->ClViewOrder,
            'ClAgeFrom' => (int)$row->ClAgeFrom,
            'ClAgeTo' => (int)$row->ClAgeTo,
            'ClSex' => (int)$row->ClSex,
            'ClId' => (string)$row->ClId,
            'ClValidClass' => (string)$row->ClValidClass,
            'ClDescription' => (string)$row->ClDescription,
            'ClAthlete' => (int)$row->ClAthlete,
            'ClDivisionsAllowed' => (string)$row->ClDivisionsAllowed,
            // Faithful to the same ground-truth-confirmed behavior
            // generate-fr-ianseo-sets.js's createClass() documents: no
            // fallback to ClId when blank in the source data.
            'ClRecClass' => (string)$row->ClRecClass,
            'ClWaClass' => (string)$row->ClWaClass,
            'ClIsPara' => (int)$row->ClIsPara,
        );
    }

    private function shapeSubClass($row) {
        return array(
            'ScTournament' => self::TOID_PLACEHOLDER,
            'ScViewOrder' => (int)$row->ScViewOrder,
            'ScId' => (string)$row->ScId,
            'ScDescription' => (string)$row->ScDescription,
        );
    }

    private function shapeEvent($row) {
        return array(
            'EvTournament' => self::TOID_PLACEHOLDER,
            'EvTeamEvent' => (int)$row->EvTeamEvent,
            'EvFinalFirstPhase' => (int)$row->EvFinalFirstPhase,
            'EvWinnerFinalRank' => (int)$row->EvWinnerFinalRank,
            'EvNumQualified' => (int)$row->EvNumQualified,
            'EvFirstQualified' => (int)$row->EvFirstQualified,
            'EvGolds' => (string)$row->EvGolds,
            'EvXNine' => (string)$row->EvXNine,
            'EvGoldsChars' => (string)$row->EvGoldsChars,
            'EvXNineChars' => (string)$row->EvXNineChars,
            'EvCheckGolds' => (int)$row->EvCheckGolds,
            'EvCheckXNines' => (int)$row->EvCheckXNines,
            'EvFinalAthTarget' => (int)$row->EvFinalAthTarget,
            'EvMatchMultipleMatches' => (int)$row->EvMatchMultipleMatches,
            'EvElimType' => (int)$row->EvElimType,
            'EvElim1' => (int)$row->EvElim1,
            'EvE1Ends' => (int)$row->EvE1Ends,
            'EvE1Arrows' => (int)$row->EvE1Arrows,
            'EvE1SO' => (int)$row->EvE1SO,
            'EvElim2' => (int)$row->EvElim2,
            'EvE2Ends' => (int)$row->EvE2Ends,
            'EvE2Arrows' => (int)$row->EvE2Arrows,
            'EvE2SO' => (int)$row->EvE2SO,
            'EvPartialTeam' => (int)$row->EvPartialTeam,
            'EvMultiTeam' => (int)$row->EvMultiTeam,
            'EvMultiTeamNo' => (int)$row->EvMultiTeamNo,
            'EvMixedTeam' => (int)$row->EvMixedTeam,
            'EvTeamCreationMode' => (int)$row->EvTeamCreationMode,
            'EvMaxTeamPerson' => (int)$row->EvMaxTeamPerson,
            'EvMatchArrowsNo' => (int)$row->EvMatchArrowsNo,
            'EvElimEnds' => (int)$row->EvElimEnds,
            'EvElimArrows' => (int)$row->EvElimArrows,
            'EvElimSO' => (int)$row->EvElimSO,
            'EvFinEnds' => (int)$row->EvFinEnds,
            'EvFinArrows' => (int)$row->EvFinArrows,
            'EvFinSO' => (int)$row->EvFinSO,
            'EvMedals' => (int)$row->EvMedals,
            'EvTourRules' => (string)$row->EvTourRules,
            'EvCodeParent' => (string)$row->EvCodeParent,
            'EvCodeParentWinnerBranch' => (int)$row->EvCodeParentWinnerBranch,
            'EvIsPara' => (int)$row->EvIsPara,
            'EvArrowPenalty' => (int)$row->EvArrowPenalty,
            'EvLoopPenalty' => (int)$row->EvLoopPenalty,
            'EvLockResults' => (int)$row->EvLockResults,
            'EvQualBestOfDistances' => (int)$row->EvQualBestOfDistances,
            'EvProgr' => (int)$row->EvProgr,
            'EvCode' => (string)$row->EvCode,
            'EvEventName' => (string)$row->EvEventName,
            'EvFinalTargetType' => (int)$row->EvFinalTargetType,
            'EvTargetSize' => (int)$row->EvTargetSize,
            'EvDistance' => (string)$row->EvDistance,
            'EvRecCategory' => (string)$row->EvRecCategory,
            'EvWaCategory' => (string)$row->EvWaCategory,
            'EvMatchMode' => (int)$row->EvMatchMode,
        );
    }

    private function shapeEventClass($row) {
        return array(
            'EcTournament' => self::TOID_PLACEHOLDER,
            'EcTeamEvent' => (int)$row->EcTeamEvent,
            'EcNumber' => (int)$row->EcNumber,
            'EcCode' => (string)$row->EcCode,
            'EcDivision' => (string)$row->EcDivision,
            'EcClass' => (string)$row->EcClass,
            'EcSubClass' => (string)$row->EcSubClass,
            'EcExtraAddons' => (int)$row->EcExtraAddons,
        );
    }

    /**
     * Same trimming rule as generate-fr-ianseo-sets.js's createDistanceNew():
     * only as many Td{n}/TdDist{n} pairs as are actually configured, not
     * all 8 -- a live row's unused slots are '' / 0 (NOT NULL columns with
     * no real "unset" state), so trailing empty pairs are dropped, keeping
     * at least Td1/TdDist1.
     */
    private function shapeDistanceRound($row) {
        $lastIndex = 1;
        for ($i = 1; $i <= 8; $i++) {
            $name = (string)$row->{"Td{$i}"};
            $dist = (int)$row->{"TdDist{$i}"};
            if ($name !== '' || $dist !== 0) {
                $lastIndex = $i;
            }
        }
        $out = array(
            'TdTournament' => self::TOID_PLACEHOLDER,
            'TdType' => (int)$row->TdType,
            'TdClasses' => (string)$row->TdClasses,
        );
        for ($i = 1; $i <= $lastIndex; $i++) {
            $out["Td{$i}"] = (string)$row->{"Td{$i}"};
            $out["TdDist{$i}"] = (int)$row->{"TdDist{$i}"};
        }
        return $out;
    }

    private function shapeDistanceInformation($row) {
        return array(
            'DiTournament' => self::TOID_PLACEHOLDER,
            'DiType' => (string)$row->DiType,
            'DiSession' => (int)$row->DiSession,
            'DiDistance' => (int)$row->DiDistance,
            'DiEnds' => (int)$row->DiEnds,
            'DiArrows' => (int)$row->DiArrows,
        );
    }

    /**
     * Same choices as generate-fr-ianseo-sets.js's createTargetFace():
     * - a row filters by class list XOR by regular expression, never both.
     *   A live row always has both columns present (one blank) -- TfRegExp
     *   wins when non-empty, matching the ground-truth export's shape.
     * - only as many TfT{n}/TfW{n} pairs as are non-zero, keeping at least
     *   TfT1/TfW1.
     */
    private function shapeTargetFace($row) {
        $lastIndex = 1;
        for ($i = 1; $i <= 8; $i++) {
            $t = (int)$row->{"TfT{$i}"};
            $w = (int)$row->{"TfW{$i}"};
            if ($t !== 0 || $w !== 0) {
                $lastIndex = $i;
            }
        }
        $out = array(
            'TfTournament' => self::TOID_PLACEHOLDER,
            'TfId' => (int)$row->TfId,
            'TfName' => (string)$row->TfName,
        );
        if ((string)$row->TfRegExp !== '') {
            $out['TfRegExp'] = (string)$row->TfRegExp;
        } else {
            $out['TfClasses'] = (string)$row->TfClasses;
        }
        $out['TfDefault'] = (string)$row->TfDefault;
        for ($i = 1; $i <= $lastIndex; $i++) {
            $out["TfT{$i}"] = (int)$row->{"TfT{$i}"};
            $out["TfW{$i}"] = (int)$row->{"TfW{$i}"};
        }
        return $out;
    }

    private function shapeSession($row) {
        return array(
            'SesTournament' => self::TOID_PLACEHOLDER,
            'SesOrder' => (int)$row->SesOrder,
            'SesType' => (string)$row->SesType,
            'SesName' => (string)$row->SesName,
            'SesTar4Session' => (int)$row->SesTar4Session,
            'SesAth4Target' => (int)$row->SesAth4Target,
            'SesFirstTarget' => (int)$row->SesFirstTarget,
            // String, not int -- matches the literal ground-truth export
            // shape (run.js's own hardcoded Sessions entry uses '0' too),
            // even though the live column is a tinyint.
            'SesFollow' => (string)$row->SesFollow,
        );
    }
}
